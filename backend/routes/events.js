const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Package = require('../models/Package');
const Payment = require('../models/Payment');
const Quotation = require('../models/Quotation');
const EquipmentItem = require('../models/EquipmentItem');
const authenticateToken = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/authorize');
const { calculatePackageCosts, calculateCustomerTotal } = require('../lib/packageCosts');

// Helper to deduct stock
async function deductEquipmentStock(event) {
  const equipmentItems = event.packageSnapshot?.equipmentItems || [];
  if (equipmentItems.length === 0) return;

  // 1. Validate stock is sufficient for all items first
  const itemsToUpdate = [];
  for (const item of equipmentItems) {
    let eqItem = null;
    if (item.equipment) {
      eqItem = await EquipmentItem.findById(item.equipment);
    } else {
      eqItem = await EquipmentItem.findOne({ name: item.name });
    }

    if (!eqItem) {
      throw new Error(`Equipment item "${item.name}" not found in database.`);
    }

    if (eqItem.availableQuantity < item.quantity) {
      throw new Error(`Insufficient stock for "${item.name}". Required: ${item.quantity}, Available: ${eqItem.availableQuantity}`);
    }

    itemsToUpdate.push({ eqItem, quantityToDeduct: item.quantity });
  }

  // 2. Perform the actual deductions
  for (const { eqItem, quantityToDeduct } of itemsToUpdate) {
    eqItem.availableQuantity -= quantityToDeduct;
    await eqItem.save();
  }
}

// Helper to restore stock
async function restoreEquipmentStock(event) {
  const equipmentItems = event.packageSnapshot?.equipmentItems || [];
  if (equipmentItems.length === 0) return;

  for (const item of equipmentItems) {
    let eqItem = null;
    if (item.equipment) {
      eqItem = await EquipmentItem.findById(item.equipment);
    } else {
      eqItem = await EquipmentItem.findOne({ name: item.name });
    }

    if (eqItem) {
      eqItem.availableQuantity += item.quantity;
      await eqItem.save();
    }
  }
}


router.use(authenticateToken);

const toBookingShape = (eventDoc) => {
  const total = Number(eventDoc.totalAmount || 0);
  const advance = Number(eventDoc.advanceAmount || 0);
  const remaining = Number(eventDoc.remainingAmount || Math.max(total - advance, 0));
  const snapshot = eventDoc.packageSnapshot || {};

  return {
    id: String(eventDoc._id),
    customerId: eventDoc.customer ? String(eventDoc.customer._id || eventDoc.customer) : null,
    customerName: eventDoc.customerName || eventDoc.customer?.name || 'Customer',
    customerEmail: eventDoc.customerEmail || eventDoc.customer?.email || '',
    eventType: eventDoc.eventType || eventDoc.title || 'event',
    eventDate: eventDoc.eventDate || (eventDoc.date ? new Date(eventDoc.date).toISOString().slice(0, 10) : ''),
    venue: eventDoc.venue || '',
    seatCategory: eventDoc.seatCategory || snapshot.tier || 'standard',
    seats: Number(eventDoc.seatCount || 0),
    menuPlan: eventDoc.menuPlan || snapshot.menuPlan || 'basic',
    decoration: Boolean(eventDoc.decoration ?? snapshot.services?.decoration),
    lighting: Boolean(eventDoc.lighting ?? snapshot.services?.lighting),
    cateringSupport: Boolean(eventDoc.cateringSupport ?? snapshot.services?.cateringSupport),
    packageId: eventDoc.package ? String(eventDoc.package._id || eventDoc.package) : null,
    packageName: eventDoc.packageName || snapshot.name || null,
    packageSnapshot: snapshot.name ? snapshot : null,
    costBreakdown: eventDoc.costBreakdown || null,
    total,
    advance,
    remaining,
    status: eventDoc.status || 'pending',
    createdAt: eventDoc.createdAt,
    updatedAt: eventDoc.updatedAt,
  };
};

router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'customer'
      ? {
        $or: [
          { customer: req.user.id },
          { customerEmail: req.user.email },
        ],
      }
      : {};

    const events = await Event.find(query).sort({ createdAt: -1 }).limit(100);

    if (!events || !Array.isArray(events)) {
      return res.json([]);
    }

    const bookings = events.map((event) => {
      try {
        return toBookingShape(event);
      } catch (mapError) {
        console.error('Error mapping event to booking shape:', mapError);
        return null;
      }
    }).filter((booking) => booking !== null);

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).limit(100);

    if (!events || !Array.isArray(events)) {
      return res.json([]);
    }

    const bookings = events.map((event) => {
      try {
        return toBookingShape(event);
      } catch (mapError) {
        console.error('Error mapping event to booking shape:', mapError);
        return null;
      }
    }).filter((booking) => booking !== null);

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching events for admin:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const authenticatedCustomer = req.user?.role === 'customer' ? req.user : null;
    const seats = Number(payload.seats || 0);
    const customerEmail = payload.customerEmail || authenticatedCustomer?.email;
    const customerName = payload.customerName || authenticatedCustomer?.name || 'Customer';

    if (!payload.eventType || !payload.eventDate || !payload.venue || !customerEmail) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    if (!payload.packageId) {
      return res.status(400).json({ error: 'Please select an event package.' });
    }

    const pkg = await Package.findById(payload.packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(400).json({ error: 'Selected package is not available.' });
    }

    if (!pkg.eventTypes.includes(payload.eventType)) {
      return res.status(400).json({ error: 'Selected package is not available for this event type.' });
    }

    if (seats < pkg.minSeats || seats > pkg.maxSeats) {
      return res.status(400).json({
        error: `This package supports ${pkg.minSeats}–${pkg.maxSeats} guests.`,
      });
    }

    const total = calculateCustomerTotal(pkg, seats);
    const advance = total * 0.3;
    const remaining = total * 0.7;
    const costs = calculatePackageCosts(pkg, seats);

    const event = new Event({
      customer: authenticatedCustomer?._id || null,
      customerName,
      customerEmail,
      eventType: payload.eventType,
      eventDate: payload.eventDate,
      venue: payload.venue,
      seatCategory: pkg.tier,
      seatCount: seats,
      menuPlan: pkg.menuPlan,
      decoration: Boolean(pkg.services?.decoration),
      lighting: Boolean(pkg.services?.lighting),
      cateringSupport: Boolean(pkg.services?.cateringSupport),
      package: pkg._id,
      packageName: pkg.name,
      packageSnapshot: {
        name: pkg.name,
        tier: pkg.tier,
        menuPlan: pkg.menuPlan,
        services: pkg.services,
        equipmentItems: (pkg.equipmentItems || []).map((item) => ({
          equipment: item.equipment,
          name: item.name,
          quantity: item.quantity,
          pricePerDay: item.pricePerDay,
        })),
      },
      costBreakdown: {
        equipmentCost: costs.equipmentCost,
        foodCost: costs.foodCost,
        staffCost: costs.staffCost,
        otherCosts: costs.otherCosts,
        totalInternalCost: costs.totalInternalCost,
        profit: costs.profit,
        profitMargin: costs.profitMargin,
      },
      title: payload.eventType,
      date: new Date(payload.eventDate),
      seats: {
        vip: pkg.tier === 'vip' ? seats : 0,
        premium: pkg.tier === 'premium' ? seats : 0,
        standard: pkg.tier === 'standard' ? seats : 0,
      },
      status: payload.status || 'pending',
      totalAmount: total,
      advanceAmount: advance,
      remainingAmount: remaining,
    });

    const saved = await event.save();
    res.status(201).json(toBookingShape(saved));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || '').toLowerCase();

    if (!['pending', 'approved', 'completed', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const prevStatus = event.status;

    // Handle stock changes
    if (prevStatus !== 'approved' && nextStatus === 'approved') {
      try {
        await deductEquipmentStock(event);
      } catch (stockErr) {
        return res.status(400).json({ error: stockErr.message });
      }
    } else if (prevStatus === 'approved' && nextStatus !== 'approved') {
      await restoreEquipmentStock(event);
    }

    event.status = nextStatus;
    const updated = await event.save();

    res.json(toBookingShape(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Restore stock if the event was approved
    if (event.status === 'approved') {
      await restoreEquipmentStock(event);
    }

    await Event.findByIdAndDelete(id);

    // Clean up associated payment and quotation records
    await Payment.deleteMany({ event: id });
    await Quotation.deleteMany({ event: id });

    res.json({ message: 'Event request successfully deleted.', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const EquipmentItem = require('../models/EquipmentItem');
const authenticateToken = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/authorize');
const {
  calculateEquipmentCost,
  calculatePackageCosts,
  MENU_FOOD_COST,
} = require('../lib/packageCosts');
const { calculateStaffCost } = require('../lib/workforceConfig');
const { packageTemplates } = require('../seeds/packages.seed');

function toPackageShape(doc, seats = null) {
  const pkg = doc.toObject ? doc.toObject() : doc;
  const costPreview = calculatePackageCosts(pkg, seats ?? pkg.maxSeats);

  return {
    id: String(pkg._id),
    name: pkg.name,
    description: pkg.description,
    icon: pkg.icon,
    eventTypes: pkg.eventTypes,
    tier: pkg.tier,
    menuPlan: pkg.menuPlan,
    services: pkg.services,
    equipmentItems: (pkg.equipmentItems || []).map((item) => ({
      equipmentId: item.equipment ? String(item.equipment._id || item.equipment) : null,
      name: item.name,
      quantity: item.quantity,
      pricePerDay: item.pricePerDay,
    })),
    staffRequired: pkg.staffRequired || [],
    foodCostPerSeat: pkg.foodCostPerSeat,
    equipmentCost: pkg.equipmentCost,
    staffCost: pkg.staffCost,
    otherCosts: pkg.otherCosts,
    totalInternalCost: pkg.totalInternalCost,
    basePrice: pkg.basePrice,
    pricePerSeat: pkg.pricePerSeat,
    minSeats: pkg.minSeats,
    maxSeats: pkg.maxSeats,
    highlights: pkg.highlights || [],
    isActive: pkg.isActive,
    costPreview,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
  };
}

async function enrichEquipmentItems(items = []) {
  const enriched = [];

  for (const item of items) {
    if (!item.equipment) continue;
    const equipment = await EquipmentItem.findById(item.equipment);
    if (!equipment) continue;

    enriched.push({
      equipment: equipment._id,
      name: equipment.name,
      quantity: Number(item.quantity || 1),
      pricePerDay: equipment.pricePerDay,
    });
  }

  return enriched;
}

async function applyCostFields(payload) {
  const equipmentItems = payload.equipmentItems || [];
  const equipmentCost = calculateEquipmentCost(equipmentItems);
  const foodCostPerSeat = Number(
    payload.foodCostPerSeat || MENU_FOOD_COST[payload.menuPlan] || MENU_FOOD_COST.classic,
  );
  const staffCost = calculateStaffCost(payload.staffRequired || []);
  const otherCosts = Number(payload.otherCosts || 0);
  const totalInternalCost =
    equipmentCost + foodCostPerSeat * Number(payload.maxSeats || 0) + staffCost + otherCosts;

  return {
    ...payload,
    equipmentItems,
    equipmentCost,
    foodCostPerSeat,
    staffCost,
    totalInternalCost,
  };
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { eventType, adminView, seats } = req.query;
    const query = req.user.role === 'admin' && adminView === 'true' ? {} : { isActive: true };

    let packages = await Package.find(query)
      .populate('equipmentItems.equipment', 'name pricePerDay')
      .sort({ tier: 1, basePrice: 1 });

    if (eventType) {
      packages = packages.filter((pkg) => pkg.eventTypes.includes(eventType));
    }

    const seatCount = seats ? Number(seats) : null;
    res.json(packages.map((pkg) => toPackageShape(pkg, seatCount)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id).populate(
      'equipmentItems.equipment',
      'name pricePerDay',
    );

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    if (!pkg.isActive && req.user.role !== 'admin') {
      return res.status(404).json({ error: 'Package not found.' });
    }

    const seats = req.query.seats ? Number(req.query.seats) : pkg.maxSeats;
    res.json(toPackageShape(pkg, seats));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.equipmentItems = await enrichEquipmentItems(payload.equipmentItems || []);
    const withCosts = await applyCostFields(payload);
    const created = await Package.create(withCosts);
    res.status(201).json(toPackageShape(created));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const existing = await Package.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    const payload = { ...existing.toObject(), ...req.body };
    if (req.body.equipmentItems) {
      payload.equipmentItems = await enrichEquipmentItems(req.body.equipmentItems);
    }
    const withCosts = await applyCostFields(payload);
    delete withCosts._id;

    const updated = await Package.findByIdAndUpdate(req.params.id, withCosts, {
      new: true,
      runValidators: true,
    });

    res.json(toPackageShape(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const deleted = await Package.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Package not found.' });
    }
    res.json({ message: 'Package deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/init', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const existing = await Package.countDocuments();
    if (existing > 0) {
      const packages = await Package.find().sort({ createdAt: 1 });
      return res.json({
        message: 'Packages already initialized.',
        count: packages.length,
        packages: packages.map((pkg) => toPackageShape(pkg)),
      });
    }

    const equipment = await EquipmentItem.find();
    const equipmentByName = new Map(equipment.map((item) => [item.name, item]));
    const created = [];

    for (const template of packageTemplates) {
      const equipmentItems = (template.equipmentNames || [])
        .map(({ name, quantity }) => {
          const match = equipmentByName.get(name);
          if (!match) return null;
          return {
            equipment: match._id,
            name: match.name,
            quantity,
            pricePerDay: match.pricePerDay,
          };
        })
        .filter(Boolean);

      const equipmentCost = calculateEquipmentCost(equipmentItems);
      const foodCostPerSeat = MENU_FOOD_COST[template.menuPlan] || MENU_FOOD_COST.classic;
      const staffCost = calculateStaffCost(template.staffRequired || []);
      const otherCosts = Number(template.otherCosts || 0);
      const totalInternalCost =
        equipmentCost + foodCostPerSeat * template.maxSeats + staffCost + otherCosts;

      const pkg = await Package.create({
        name: template.name,
        description: template.description,
        icon: template.icon,
        eventTypes: template.eventTypes,
        tier: template.tier,
        menuPlan: template.menuPlan,
        services: template.services,
        equipmentItems,
        staffRequired: template.staffRequired,
        foodCostPerSeat,
        equipmentCost,
        staffCost,
        otherCosts,
        totalInternalCost,
        basePrice: template.basePrice,
        pricePerSeat: template.pricePerSeat,
        minSeats: template.minSeats,
        maxSeats: template.maxSeats,
        highlights: template.highlights,
        isActive: true,
      });

      created.push(pkg);
    }

    res.status(201).json({
      message: `Created ${created.length} event packages.`,
      count: created.length,
      packages: created.map((pkg) => toPackageShape(pkg)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

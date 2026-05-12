const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authenticateToken = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/authorize');

const toBookingShape = (eventDoc) => {
  const total = Number(eventDoc.totalAmount || 0);
  const advance = Number(eventDoc.advanceAmount || 0);
  const remaining = Number(eventDoc.remainingAmount || Math.max(total - advance, 0));

  return {
    id: String(eventDoc._id),
    customerName: eventDoc.customerName || 'Customer',
    customerEmail: eventDoc.customerEmail || '',
    eventType: eventDoc.eventType || eventDoc.title || 'event',
    eventDate: eventDoc.eventDate || (eventDoc.date ? new Date(eventDoc.date).toISOString().slice(0, 10) : ''),
    venue: eventDoc.venue || '',
    seatCategory: eventDoc.seatCategory || 'standard',
    seats: Number(eventDoc.seatCount || 0),
    menuPlan: eventDoc.menuPlan || 'basic',
    decoration: Boolean(eventDoc.decoration),
    lighting: Boolean(eventDoc.lighting),
    cateringSupport: Boolean(eventDoc.cateringSupport),
    total,
    advance,
    remaining,
    status: eventDoc.status || 'pending',
    createdAt: eventDoc.createdAt,
    updatedAt: eventDoc.updatedAt,
  };
};

// GET /api/events - list bookings/events (accessible to everyone, but returns all events)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).limit(100);

    if (!events || !Array.isArray(events)) {
      return res.json([]);
    }

    const bookings = events.map(event => {
      try {
        return toBookingShape(event);
      } catch (mapError) {
        console.error('Error mapping event to booking shape:', mapError);
        return null;
      }
    }).filter(booking => booking !== null);

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/admin/all - admin-only: get ALL events with full details
router.get('/admin/all', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).limit(100);

    if (!events || !Array.isArray(events)) {
      return res.json([]);
    }

    const bookings = events.map(event => {
      try {
        return toBookingShape(event);
      } catch (mapError) {
        console.error('Error mapping event to booking shape:', mapError);
        return null;
      }
    }).filter(booking => booking !== null);

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching events for admin:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events - create booking/event
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const seats = Number(payload.seats || 0);
    const total = Number(payload.total || 0);
    const advance = Number(payload.advance || 0);
    const remaining = Number(payload.remaining || Math.max(total - advance, 0));

    if (!payload.eventType || !payload.eventDate || !payload.venue || !payload.customerEmail) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const event = new Event({
      customerName: payload.customerName || 'Customer',
      customerEmail: payload.customerEmail,
      eventType: payload.eventType,
      eventDate: payload.eventDate,
      venue: payload.venue,
      seatCategory: payload.seatCategory || 'standard',
      seatCount: seats,
      menuPlan: payload.menuPlan || 'basic',
      decoration: Boolean(payload.decoration),
      lighting: Boolean(payload.lighting),
      cateringSupport: Boolean(payload.cateringSupport),
      title: payload.eventType,
      date: new Date(payload.eventDate),
      seats: {
        vip: payload.seatCategory === 'vip' ? seats : 0,
        premium: payload.seatCategory === 'premium' ? seats : 0,
        standard: payload.seatCategory === 'standard' ? seats : 0,
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

// PATCH /api/events/:id/status - update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || '').toLowerCase();

    if (!['pending', 'approved', 'completed', 'rejected'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: { status: nextStatus } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json(toBookingShape(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

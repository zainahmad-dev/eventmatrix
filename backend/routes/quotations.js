const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Quotation = require('../models/Quotation');
const Payment = require('../models/Payment');

const formatInvoiceNumber = (id) => `INV-${String(id).slice(-6).toUpperCase()}`;

const toSeatShape = (seatCategory, seats) => {
  const normalized = String(seatCategory || 'standard').toLowerCase();
  const count = Number(seats || 0);
  return {
    vip: normalized === 'vip' ? count : 0,
    premium: normalized === 'premium' ? count : 0,
    standard: normalized === 'standard' ? count : 0,
  };
};

router.post('/generate-from-bookings', async (req, res) => {
  const bookings = Array.isArray(req.body?.bookings) ? req.body.bookings : [];

  if (!bookings.length) {
    return res.status(400).json({ error: 'No approved bookings were provided.' });
  }

  try {
    let createdCount = 0;

    for (const booking of bookings) {
      const bookingId = booking?.id;
      if (!bookingId) {
        continue;
      }

      const alreadyExists = await Quotation.findOne({ bookingId });
      if (alreadyExists) {
        continue;
      }

      const totalAmount = Number(booking?.total || 0);
      const advance = Number(booking?.advance || 0);
      const dueAmount = Math.max(totalAmount - advance, 0);

      const event = await Event.create({
        title: booking?.eventType || 'Event Booking',
        date: booking?.eventDate ? new Date(booking.eventDate) : undefined,
        venue: booking?.venue || 'TBD',
        seats: toSeatShape(booking?.seatCategory, booking?.seats),
        totalAmount,
        status: 'approved',
      });

      const payment = await Payment.create({
        event: event._id,
        totalAmount,
        paidAmount: advance,
        dueAmount,
        status: dueAmount > 0 ? 'partial' : 'paid',
        payments: advance > 0 ? [{ amount: advance, date: new Date(), method: 'advance' }] : [],
      });

      const quotation = await Quotation.create({
        event: event._id,
        bookingId,
        customerName: booking?.customerName || 'Customer',
        customerEmail: booking?.customerEmail || '',
        eventType: booking?.eventType || 'Event Booking',
        eventDate: booking?.eventDate || '',
        venue: booking?.venue || 'TBD',
        items: [
          {
            name: `${booking?.eventType || 'Event'} Package (${String(booking?.seatCategory || 'standard').toUpperCase()})`,
            price: totalAmount,
          },
        ],
        totalPrice: totalAmount,
        payment: payment._id,
      });

      quotation.invoiceNumber = formatInvoiceNumber(quotation._id);
      await quotation.save();
      createdCount += 1;
    }

    res.json({
      createdCount,
      summary: createdCount
        ? `Created ${createdCount} quotation/invoice record(s) from approved bookings.`
        : 'No new records created. Approved bookings may already be invoiced.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate('payment')
      .sort({ createdAt: -1 })
      .limit(40);

    const formatted = quotations.map((quotation) => {
      const payment = quotation.payment || null;
      return {
        id: quotation._id,
        invoiceNumber: quotation.invoiceNumber || formatInvoiceNumber(quotation._id),
        customerName: quotation.customerName || 'Customer',
        customerEmail: quotation.customerEmail || '',
        eventType: quotation.eventType || 'Event Booking',
        eventDate: quotation.eventDate || '',
        venue: quotation.venue || 'TBD',
        totalPrice: quotation.totalPrice || 0,
        paidAmount: payment?.paidAmount || 0,
        dueAmount: payment?.dueAmount || 0,
        paymentStatus: payment?.status || 'partial',
        paymentId: payment?._id || null,
        createdAt: quotation.createdAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/payments/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const amount = Number(req.body?.amount || 0);
  const method = String(req.body?.method || 'manual');

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0.' });
  }

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    const remainingBefore = Math.max((payment.totalAmount || 0) - (payment.paidAmount || 0), 0);
    const acceptedAmount = Math.min(amount, remainingBefore);

    if (acceptedAmount <= 0) {
      return res.status(400).json({ error: 'This invoice is already fully paid.' });
    }

    payment.paidAmount = Number(payment.paidAmount || 0) + acceptedAmount;
    payment.dueAmount = Math.max(Number(payment.totalAmount || 0) - payment.paidAmount, 0);
    payment.status = payment.dueAmount > 0 ? 'partial' : 'paid';
    payment.payments.push({ amount: acceptedAmount, date: new Date(), method });

    await payment.save();

    res.json({
      paymentId: payment._id,
      paidAmount: payment.paidAmount,
      dueAmount: payment.dueAmount,
      status: payment.status,
      acceptedAmount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/download/:quotationId', async (req, res) => {
  const { quotationId } = req.params;

  try {
    const quotation = await Quotation.findById(quotationId).populate('payment');
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    const payment = quotation.payment;
    const lines = [
      'EventMatrix - Quotation & Invoice',
      `Invoice No: ${quotation.invoiceNumber || formatInvoiceNumber(quotation._id)}`,
      `Issued On: ${new Date(quotation.createdAt).toISOString().slice(0, 10)}`,
      '',
      `Customer: ${quotation.customerName || 'Customer'}`,
      `Email: ${quotation.customerEmail || 'N/A'}`,
      `Event: ${quotation.eventType || 'Event Booking'}`,
      `Date: ${quotation.eventDate || 'N/A'}`,
      `Venue: ${quotation.venue || 'N/A'}`,
      '',
      'Items:',
      ...(quotation.items || []).map((item) => `- ${item.name}: PKR ${Number(item.price || 0).toLocaleString('en-PK')}`),
      '',
      `Total: PKR ${Number(quotation.totalPrice || 0).toLocaleString('en-PK')}`,
      `Paid: PKR ${Number(payment?.paidAmount || 0).toLocaleString('en-PK')}`,
      `Due: PKR ${Number(payment?.dueAmount || 0).toLocaleString('en-PK')}`,
      `Status: ${(payment?.status || 'partial').toUpperCase()}`,
    ];

    const content = lines.join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.invoiceNumber || formatInvoiceNumber(quotation._id)}.txt"`);
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

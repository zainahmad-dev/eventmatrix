const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  bookingId: { type: String, index: true },
  invoiceNumber: String,
  customerName: String,
  customerEmail: String,
  eventType: String,
  eventDate: String,
  venue: String,
  items: [
    {
      name: String,
      price: Number
    }
  ],
  totalPrice: Number,
  pdfUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);

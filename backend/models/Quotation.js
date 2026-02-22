const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
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

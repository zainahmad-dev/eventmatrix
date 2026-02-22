const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  totalAmount: Number,
  paidAmount: { type: Number, default: 0 },
  dueAmount: Number,
  status: { type: String, enum: ['partial', 'paid'], default: 'partial' },
  payments: [
    {
      amount: Number,
      date: Date,
      method: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

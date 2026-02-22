const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendance: [
    {
      date: Date,
      status: { type: String, enum: ['present', 'absent'] }
    }
  ],
  assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  performanceRating: { type: Number, min: 1, max: 5 },
  overtimeHours: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);

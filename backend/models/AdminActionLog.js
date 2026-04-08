const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: [
      'approve_pending_bookings',
      'assign_staff_to_events',
      'open_inventory_alerts',
      'generate_salary_report',
      'send_payment_reminders',
    ],
    required: true,
  },
  performedBy: { type: String, default: 'admin' },
  summary: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);
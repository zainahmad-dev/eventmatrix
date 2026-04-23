const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer', 'employee'], required: true },
  employeeRole: {
    type: String,
    enum: ['waiter', 'chef', 'manager', 'team_lead'],
    required: function requiredEmployeeRole() {
      return this.role === 'employee';
    },
  },
  salary: { type: Number, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  phone: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

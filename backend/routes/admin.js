const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const User = require('../models/User');
const AdminActionLog = require('../models/AdminActionLog');

const ACTIONS = {
  approve_pending_bookings: 'Approve Pending Bookings',
  assign_staff_to_events: 'Assign Staff to Events',
  open_inventory_alerts: 'Open Inventory Alerts',
  generate_salary_report: 'Generate Salary Report',
  send_payment_reminders: 'Send Payment Reminders',
};

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

router.post('/actions/:actionType', async (req, res) => {
  const { actionType } = req.params;
  const performedBy = req.body?.performedBy || 'admin';

  if (!ACTIONS[actionType]) {
    return res.status(400).json({ error: 'Unknown action type' });
  }

  try {
    let summary = '';
    let payload = {};

    if (actionType === 'approve_pending_bookings') {
      const update = await Event.updateMany({ status: 'pending' }, { $set: { status: 'approved' } });
      summary = update.modifiedCount
        ? `Approved ${pluralize(update.modifiedCount, 'pending booking')}.`
        : 'No pending bookings were found to approve.';
      payload = { modifiedCount: update.modifiedCount };
    }

    if (actionType === 'assign_staff_to_events') {
      const pendingEvents = await Event.countDocuments({ status: 'pending' });
      const employees = await User.countDocuments({ role: 'employee' });
      summary = pendingEvents
        ? `Staff assignment checked ${pluralize(pendingEvents, 'pending event')} with ${pluralize(employees, 'available employee')}.`
        : `No pending events require staff assignment right now. ${pluralize(employees, 'employee')} currently available.`;
      payload = { pendingEvents, employees };
    }

    if (actionType === 'open_inventory_alerts') {
      const lowStockItems = await Inventory.find({
        $expr: {
          $lte: ['$availableQuantity', { $multiply: ['$totalQuantity', 0.2] }],
        },
      });
      summary = lowStockItems.length
        ? `Detected ${pluralize(lowStockItems.length, 'low-stock item')} that need attention.`
        : 'Inventory check completed with no low-stock alerts.';
      payload = { lowStockItems: lowStockItems.map((item) => ({ id: item._id, itemName: item.itemName })) };
    }

    if (actionType === 'generate_salary_report') {
      const employees = await User.find({ role: 'employee' }, { name: 1, employeeRole: 1, salary: 1 });
      const totalSalary = employees.reduce((sum, employee) => sum + (employee.salary || 0), 0);
      summary = employees.length
        ? `Salary report generated for ${pluralize(employees.length, 'employee')}. Estimated payroll: PKR ${totalSalary.toLocaleString('en-PK')}.`
        : 'Salary report generated, but no employee payroll records are available yet.';
      payload = { totalEmployees: employees.length, totalSalary };
    }

    if (actionType === 'send_payment_reminders') {
      const duePayments = await Payment.countDocuments({ dueAmount: { $gt: 0 } });
      summary = duePayments
        ? `Queued ${pluralize(duePayments, 'payment reminder')} for overdue invoices.`
        : 'No overdue invoices were found, so no payment reminders were sent.';
      payload = { duePayments };
    }

    const log = await AdminActionLog.create({ actionType, performedBy, summary, payload });
    res.json({ actionType, actionLabel: ACTIONS[actionType], summary, payload, logId: log._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/actions', async (req, res) => {
  try {
    const logs = await AdminActionLog.find().sort({ createdAt: -1 }).limit(15);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
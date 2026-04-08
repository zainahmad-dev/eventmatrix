const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const employees = await User.find(
      { role: 'employee' },
      { name: 1, email: 1, employeeRole: 1, salary: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });

    const byRole = employees.reduce((acc, employee) => {
      const role = employee.employeeRole || 'unassigned';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const totalPayroll = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);

    res.json({
      employees,
      summary: {
        totalEmployees: employees.length,
        byRole,
        totalPayroll,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

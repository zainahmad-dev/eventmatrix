const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const authenticateToken = require('../middleware/auth');

// GET /api/employees - Get employee list & summary for admin
router.get('/', authenticateToken, async (req, res) => {
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

// POST /api/employees/attendance - Mark attendance for current day
router.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find or create Employee details document
    let employee = await Employee.findOne({ user: userId });
    if (!employee) {
      employee = await Employee.create({ user: userId, attendance: [] });
    }

    // Check if attendance already marked today
    const todayStr = new Date().toDateString();
    const alreadyMarked = employee.attendance.some(
      (entry) => new Date(entry.date).toDateString() === todayStr
    );

    if (alreadyMarked) {
      return res.status(400).json({ error: 'Attendance already marked for today.' });
    }

    employee.attendance.push({ date: new Date(), status: 'present' });
    await employee.save();

    res.json({ message: 'Attendance marked successfully.', attendance: employee.attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/attendance - Get attendance stats (all for admin, own for employee)
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const allAttendance = await Employee.find().populate('user', 'name email employeeRole');
      res.json(allAttendance);
    } else {
      let employee = await Employee.findOne({ user: req.user.id });
      if (!employee) {
        employee = await Employee.create({ user: req.user.id, attendance: [] });
      }
      res.json(employee);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/payslip/download/:userId? - Download text pay slip
router.get('/payslip/download/:userId?', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    // Security check: non-admin can only download their own payslip
    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      return res.status(403).json({ error: 'Unauthorized to download this payslip.' });
    }

    const employeeUser = await User.findById(targetUserId);
    if (!employeeUser || employeeUser.role !== 'employee') {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    let employeeDetails = await Employee.findOne({ user: targetUserId });
    if (!employeeDetails) {
      employeeDetails = await Employee.create({ user: targetUserId, attendance: [] });
    }

    // Calculate present days in the current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const presentDays = employeeDetails.attendance.filter((entry) => {
      const d = new Date(entry.date);
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        entry.status === 'present'
      );
    }).length;

    const baseSalary = employeeUser.salary || 0;
    const bonus = employeeDetails.bonus || 0;
    const overtimeHours = employeeDetails.overtimeHours || 0;
    const hourlyOvertimeRate = 250; // standard hourly overtime rate in PKR
    const overtimePay = overtimeHours * hourlyOvertimeRate;
    const netSalary = baseSalary + bonus + overtimePay;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthStr = monthNames[currentMonth];

    const lines = [
      '==================================================',
      '               EVENTMATRIX PAY SLIP               ',
      '==================================================',
      `Period: ${monthStr} ${currentYear}`,
      `Generated On: ${new Date().toISOString().slice(0, 10)}`,
      '--------------------------------------------------',
      `Employee Name:  ${employeeUser.name}`,
      `Email Address:  ${employeeUser.email}`,
      `Role:           ${String(employeeUser.employeeRole || 'staff').toUpperCase().replace('_', ' ')}`,
      '--------------------------------------------------',
      `Base Salary:    PKR ${baseSalary.toLocaleString('en-PK')}`,
      `Present Days:   ${presentDays} days`,
      `Overtime Hours: ${overtimeHours} hrs (Rate: PKR ${hourlyOvertimeRate}/hr)`,
      `Overtime Pay:   PKR ${overtimePay.toLocaleString('en-PK')}`,
      `Bonus:          PKR ${bonus.toLocaleString('en-PK')}`,
      '--------------------------------------------------',
      `NET PAYABLE:    PKR ${netSalary.toLocaleString('en-PK')}`,
      '==================================================',
      'Status:         APPROVED & PAID',
      '==================================================',
    ];

    const content = lines.join('\n');
    const filename = `Payslip_${employeeUser.name.replace(/\s+/g, '_')}_${monthStr}_${currentYear}.txt`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

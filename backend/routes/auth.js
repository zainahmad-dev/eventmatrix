const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const WORKFORCE_CONFIG = {
  waiter: { limit: 8, salary: 20000 },
  chef: { limit: 5, salary: 35000 },
  manager: { limit: 1, salary: 50000 },
  team_lead: { limit: 1, salary: 40000 },
};

const MAX_EMPLOYEES = 15;

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, employeeRole } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    let payload = { name, email, role, phone };

    if (role === 'employee') {
      if (!employeeRole || !WORKFORCE_CONFIG[employeeRole]) {
        return res.status(400).json({ error: 'Employee role is required (waiter, chef, manager, team_lead).' });
      }

      const totalEmployees = await User.countDocuments({ role: 'employee' });
      if (totalEmployees >= MAX_EMPLOYEES) {
        return res.status(400).json({ error: 'Employee capacity reached. Only 15 employees can be registered.' });
      }

      const roleCount = await User.countDocuments({ role: 'employee', employeeRole });
      const roleLimit = WORKFORCE_CONFIG[employeeRole].limit;
      if (roleCount >= roleLimit) {
        return res.status(400).json({ error: `${employeeRole} capacity reached. Limit is ${roleLimit}.` });
      }

      payload = {
        ...payload,
        employeeRole,
        salary: WORKFORCE_CONFIG[employeeRole].salary,
      };
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ ...payload, password: hash });
    res.status(201).json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeRole: user.employeeRole,
      salary: user.salary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeRole: user.employeeRole,
        salary: user.salary,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

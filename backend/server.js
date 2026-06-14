const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authenticateToken = require('./middleware/auth');
const { authorizeAdmin } = require('./middleware/authorize');
const eventsRouter = require('./routes/events');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const quotationsRouter = require('./routes/quotations');
const employeesRouter = require('./routes/employees');
const inventoryRouter = require('./routes/inventory');
const equipmentRouter = require('./routes/equipment');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

require('./models/User');
require('./models/Event');
require('./models/Employee');
require('./models/Inventory');
require('./models/Payment');
require('./models/Quotation');
require('./models/AdminActionLog');
require('./models/Category');
require('./models/EquipmentItem');
require('./models/EquipmentBooking');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventmatrix';

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const modelNames = ['User', 'Event', 'Employee', 'Inventory', 'Payment', 'Quotation', 'AdminActionLog', 'Category', 'EquipmentItem', 'EquipmentBooking'];
    await Promise.all(modelNames.map(async (name) => {
      await mongoose.model(name).createCollection();
    }));
    console.log('All collections initialized');
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

app.get('/', (req, res) => res.send('EventMatrix backend running'));

// Routes (protected with auth middleware for admin operations)
app.use('/api/auth', authRouter); // Auth routes don't need token
app.use('/api/events', eventsRouter);
app.use('/api/equipment', equipmentRouter); // Equipment routes: public GET, protected POST/PUT/DELETE
app.use('/api/inventory', inventoryRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/employees', employeesRouter);
// Admin routes should be protected
app.use('/api/admin', authenticateToken, authorizeAdmin, adminRouter);

// quick test route to create an admin if needed
app.post('/test-user', async (req, res) => {
  const User = require('./models/User');
  try {
    const exists = await User.findOne({ email: 'admin@example.com' });
    if (exists) return res.json({ msg: 'admin exists', user: exists });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password', 10);
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: hash, role: 'admin' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

startServer();

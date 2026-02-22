const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const eventsRouter = require('./routes/events');
const authRouter = require('./routes/auth');

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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventmatrix';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    const modelNames = ['User', 'Event', 'Employee', 'Inventory', 'Payment', 'Quotation'];
    await Promise.all(modelNames.map(async (name) => {
      await mongoose.model(name).createCollection();
    }));
    console.log('All collections initialized');
  })
  .catch(err => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => res.send('EventMatrix backend running'));

app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);

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

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

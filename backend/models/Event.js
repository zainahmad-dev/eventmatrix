const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: String,
  customerEmail: String,
  eventType: String,
  eventDate: String,
  seatCategory: String,
  seatCount: Number,
  menuPlan: String,
  decoration: Boolean,
  lighting: Boolean,
  cateringSupport: Boolean,
  advanceAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  title: String,
  date: Date,
  venue: String,

  seats: {
    vip: Number,
    premium: Number,
    standard: Number
  },

  prices: {
    vip: { type: Number, default: 1500 },
    premium: { type: Number, default: 1200 },
    standard: { type: Number, default: 800 }
  },

  menu: String,
  decor: String,

  status: {
    type: String,
    enum: ["pending", "approved", "completed", "rejected"],
    default: "pending"
  },

  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  inventoryUsed: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
    quantity: Number
  }],

  package: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  packageName: String,
  packageSnapshot: {
    name: String,
    tier: String,
    menuPlan: String,
    services: {
      decoration: Boolean,
      lighting: Boolean,
      cateringSupport: Boolean,
    },
    equipmentItems: [{
      equipment: { type: mongoose.Schema.Types.ObjectId, ref: "EquipmentItem" },
      name: String,
      quantity: Number,
      pricePerDay: Number,
    }],
  },
  costBreakdown: {
    equipmentCost: Number,
    foodCost: Number,
    staffCost: Number,
    otherCosts: Number,
    totalInternalCost: Number,
    profit: Number,
    profitMargin: Number,
  },

  totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
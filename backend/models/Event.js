const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

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
    enum: ["pending", "approved", "completed"],
    default: "pending"
  },

  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  inventoryUsed: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
    quantity: Number
  }],

  totalAmount: Number
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
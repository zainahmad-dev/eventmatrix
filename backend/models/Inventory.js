const mongoose = require('mongoose');

/**
 * Inventory Schema
 * Tracks all inventory items, quantities, categories, and usage
 *
 * Fields:
 * - itemName: Name of the inventory item
 * - category: Type of item (decoration, lighting, catering, etc)
 * - description: Detailed description of the item
 * - totalQuantity: Total units available
 * - usedQuantity: Units currently in use
 * - remainingQuantity: Available units (auto-calculated)
 * - unit: Measurement unit (pieces, sets, kg, liters, etc)
 * - costPerUnit: Price per unit
 * - totalCost: Total cost of all units
 * - minThreshold: Alert level when stock is low
 * - status: Current status (in-stock, low-stock, out-of-stock)
 * - supplier: Supplier information
 * - lastRestocked: Date of last restock
 * - lastUsed: Date item was last used
 * - notes: Additional notes
 */
const inventorySchema = new mongoose.Schema({
  // Basic Information
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['decoration', 'lighting', 'catering', 'furniture', 'supplies', 'equipment'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },

  // Quantity Management
  totalQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  usedQuantity: {
    type: Number,
    default: 0,
  },
  remainingQuantity: {
    type: Number,
    default: function() {
      return this.totalQuantity - this.usedQuantity;
    },
  },

  // Unit & Pricing
  unit: {
    type: String,
    enum: ['pieces', 'sets', 'rolls', 'meters', 'kg', 'liters', 'boxes', 'packs'],
    default: 'pieces',
  },
  costPerUnit: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: function() {
      return this.totalQuantity * this.costPerUnit;
    },
  },

  // Alert & Status
  minThreshold: {
    type: Number,
    default: 5,
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock',
  },

  // Supplier Information
  supplier: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },

  // Tracking
  lastRestocked: {
    type: Date,
    default: null,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
  notes: String,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Pre-save hook to calculate values and update status
inventorySchema.pre('save', function(next) {
  // Calculate remaining quantity
  this.remainingQuantity = this.totalQuantity - this.usedQuantity;

  // Calculate total cost
  this.totalCost = this.totalQuantity * this.costPerUnit;

  // Update status based on remaining quantity
  if (this.remainingQuantity === 0) {
    this.status = 'out-of-stock';
  } else if (this.remainingQuantity <= this.minThreshold) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }

  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);

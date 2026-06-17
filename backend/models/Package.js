const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🎉' },
    eventTypes: {
      type: [String],
      default: ['wedding'],
    },
    tier: {
      type: String,
      enum: ['vip', 'premium', 'standard'],
      default: 'premium',
    },
    menuPlan: {
      type: String,
      enum: ['basic', 'classic', 'premium'],
      default: 'classic',
    },
    services: {
      decoration: { type: Boolean, default: true },
      lighting: { type: Boolean, default: false },
      cateringSupport: { type: Boolean, default: true },
    },
    equipmentItems: [
      {
        equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentItem' },
        name: String,
        quantity: { type: Number, default: 1, min: 0 },
        pricePerDay: { type: Number, default: 0 },
      },
    ],
    staffRequired: [
      {
        role: {
          type: String,
          enum: ['waiter', 'chef', 'manager', 'team_lead'],
        },
        count: { type: Number, default: 0, min: 0 },
      },
    ],
    foodCostPerSeat: { type: Number, default: 0 },
    equipmentCost: { type: Number, default: 0 },
    staffCost: { type: Number, default: 0 },
    otherCosts: { type: Number, default: 0 },
    totalInternalCost: { type: Number, default: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    pricePerSeat: { type: Number, required: true, min: 0 },
    minSeats: { type: Number, default: 20, min: 1 },
    maxSeats: { type: Number, default: 200, min: 1 },
    highlights: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Package', packageSchema);

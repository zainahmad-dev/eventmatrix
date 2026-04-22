const mongoose = require('mongoose');

/**
 * Equipment Item Schema
 * Represents rental equipment that can be booked for events
 *
 * Fields:
 * - name: Item name (e.g., "Chair - Plastic")
 * - category: Reference to Category model
 * - description: Detailed description
 * - images: Array of image URLs
 * - totalQuantity: Total units available
 * - availableQuantity: Units not currently booked (auto-calculated)
 * - pricePerDay: Rental price per day
 * - condition: Current condition of equipment
 * - lastMaintenance: Date of last maintenance
 * - maintenanceNotes: Notes about maintenance history
 */
const equipmentItemSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },

    // Images
    images: {
      type: [String], // Array of image URLs
      default: [],
    },

    // Quantity Management
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Pricing
    pricePerDay: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Condition Tracking
    condition: {
      type: String,
      enum: ['good', 'damaged', 'under-maintenance'],
      default: 'good',
    },
    lastMaintenance: {
      type: Date,
      default: null,
    },
    maintenanceNotes: {
      type: String,
      default: '',
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to ensure availableQuantity never exceeds totalQuantity
equipmentItemSchema.pre('save', function (next) {
  if (this.availableQuantity > this.totalQuantity) {
    this.availableQuantity = this.totalQuantity;
  }
  next();
});

// Instance method: Check availability for a date range
equipmentItemSchema.methods.getAvailabilityForDateRange = async function (startDate, endDate) {
  const EquipmentBooking = mongoose.model('EquipmentBooking');

  // Find all bookings that overlap with the given date range
  const overlappingBookings = await EquipmentBooking.find({
    equipmentItem: this._id,
    status: { $in: ['reserved', 'used'] }, // Only count active bookings
    'dateRange.start': { $lt: endDate },
    'dateRange.end': { $gt: startDate },
  });

  // Calculate total quantity booked during this period
  const bookedQuantity = overlappingBookings.reduce((sum, booking) => sum + booking.quantity, 0);

  // Return available quantity
  return Math.max(0, this.totalQuantity - bookedQuantity);
};

module.exports = mongoose.model('EquipmentItem', equipmentItemSchema);

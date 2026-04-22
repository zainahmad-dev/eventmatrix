const mongoose = require('mongoose');

/**
 * Equipment Booking Schema
 * Links Events to Equipment Items for specific date ranges
 * Tracks reservations of equipment for events
 *
 * Fields:
 * - event: Reference to Event being booked
 * - equipmentItem: Reference to EquipmentItem being reserved
 * - quantity: How many units of this item are reserved
 * - dateRange: Start and end dates for the reservation
 * - status: Current state of the booking
 * - notes: Any special notes about this booking
 */
const equipmentBookingSchema = new mongoose.Schema(
  {
    // References
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    equipmentItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentItem',
      required: true,
    },

    // Quantity & Dates
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    dateRange: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ['reserved', 'used', 'returned', 'cancelled'],
      default: 'reserved',
    },

    // Notes
    notes: {
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

// Index for fast queries on date ranges
equipmentBookingSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });
equipmentBookingSchema.index({ equipmentItem: 1, event: 1 });
equipmentBookingSchema.index({ status: 1 });

module.exports = mongoose.model('EquipmentBooking', equipmentBookingSchema);

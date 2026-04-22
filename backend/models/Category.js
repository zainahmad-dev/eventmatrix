const mongoose = require('mongoose');

/**
 * Equipment Category Schema
 * Represents categories of equipment (Decoration, Lighting, Catering, etc.)
 */
const categorySchema = new mongoose.Schema(
  {
    // Category identification
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        'Decoration',
        'Lighting',
        'Catering Equipment',
        'Furniture',
        'Sound & Audio',
        'Media & Production',
        'General Supplies',
      ],
    },

    // Display
    icon: {
      type: String, // Emoji icon (e.g., '🎨', '💡', '🍽️')
      default: '📦',
    },
    description: {
      type: String,
      default: '',
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);

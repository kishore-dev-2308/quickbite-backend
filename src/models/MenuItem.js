const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Pizza', 'Burger', 'Drinks', 'Dessert', 'Sides'],
      default: 'Pizza'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    preparationTimeMinutes: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);

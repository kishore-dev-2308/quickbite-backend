const mongoose = require('mongoose');
const { ORDER_STATUSES, STATUS_NOTES } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String
  }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ORDER_STATUSES,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true
    },
    customerEmail: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 3.99,
      min: 0
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Order Received'
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: function () {
        return [
          {
            status: 'Order Received',
            timestamp: new Date(),
            note: STATUS_NOTES['Order Received'] || 'Order created'
          }
        ];
      }
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit/Debit Card', 'Online Pay'],
      default: 'Cash on Delivery'
    },
    notes: {
      type: String,
      default: ''
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 30
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);

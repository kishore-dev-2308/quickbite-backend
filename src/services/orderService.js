const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { PRICING, STATUS_NOTES, ORDER_STATUSES } = require('../config/constants');
const { emitOrderStatusUpdate, emitNewOrder } = require('../sockets/socketHandler');

/**
 * Validates cart items against database, computes totals, and creates an order
 */
const createOrder = async (orderPayload, userId = null) => {
  const {
    customerName,
    customerPhone,
    customerEmail = '',
    deliveryAddress,
    items,
    paymentMethod = 'Cash on Delivery',
    notes = ''
  } = orderPayload;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // 1. Validate availability and construct verified line items
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    let dbItem = null;
    if (item.menuItemId && mongoose.isValidObjectId(item.menuItemId)) {
      dbItem = await MenuItem.findById(item.menuItemId);
    }

    // Resilient fallback: If ID is stale (e.g. from client localStorage across server restarts), match by exact dish name
    if (!dbItem && item.name) {
      dbItem = await MenuItem.findOne({ name: item.name });
    }

    if (!dbItem) {
      throw new Error(`Menu item "${item.name || item.menuItemId}" could not be found. Please refresh your cart.`);
    }
    if (!dbItem.isAvailable) {
      throw new Error(`Item "${dbItem.name}" is currently sold out.`);
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10));
    const linePrice = dbItem.price;
    subtotal += linePrice * quantity;

    verifiedItems.push({
      menuItem: dbItem._id,
      name: dbItem.name,
      price: linePrice,
      quantity,
      image: dbItem.image
    });
  }

  subtotal = parseFloat(subtotal.toFixed(2));
  const deliveryFee = subtotal >= PRICING.FREE_DELIVERY_THRESHOLD ? 0 : PRICING.DEFAULT_DELIVERY_FEE;
  const tax = parseFloat((subtotal * PRICING.TAX_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  // 3. Create Order
  const initialStatus = 'Order Received';
  const initialNote = STATUS_NOTES[initialStatus] || 'Order received by restaurant';

  const newOrder = new Order({
    user: userId,
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    items: verifiedItems,
    subtotal,
    deliveryFee,
    tax,
    totalAmount,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: initialNote
      }
    ],
    paymentMethod,
    notes,
    estimatedDeliveryMinutes: 30
  });

  await newOrder.save();

  // Notify kitchen dashboard in real-time
  emitNewOrder(newOrder.toObject());

  return newOrder;
};

/**
 * Retrieves a single order by ID
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate('user', 'name email');
  return order;
};

/**
 * Retrieves order history strictly for the authenticated user
 */
const getUserOrders = async (userOrId) => {
  let userId = userOrId;
  if (typeof userOrId === 'object' && userOrId !== null) {
    userId = userOrId._id;
  }

  const orders = await Order.find({ user: userId })
    .populate('items.menuItem', 'name price image')
    .sort({ createdAt: -1 });

  return orders;
};

/**
 * Claims guest orders by associating them with a newly logged-in/registered user
 */
const claimGuestOrders = async (orderIds, userId, userProfile = {}) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return { claimedCount: 0 };
  }

  const validIds = orderIds.filter(id => mongoose.isValidObjectId(id));
  if (validIds.length === 0) {
    return { claimedCount: 0 };
  }

  const updateFields = { user: userId };
  if (userProfile.email) {
    updateFields.customerEmail = userProfile.email.toLowerCase();
  }

  const result = await Order.updateMany(
    { _id: { $in: validIds }, user: null },
    { $set: updateFields }
  );

  return { claimedCount: result.modifiedCount || 0 };
};

/**
 * Retrieves multiple orders by ID (for guest viewing of local recent orders)
 */
const getOrdersBatch = async (orderIds) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return [];
  const validIds = orderIds.filter(id => mongoose.isValidObjectId(id));
  return Order.find({ _id: { $in: validIds } })
    .populate('items.menuItem', 'name price image')
    .sort({ createdAt: -1 });
};

/**
 * Retrieves all orders for the admin/kitchen management panel
 */
const getAllOrders = async () => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  return orders;
};

/**
 * Updates order status and emits WebSocket update
 */
const updateOrderStatus = async (orderId, newStatus, customNote = null) => {
  if (!ORDER_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const note = customNote || STATUS_NOTES[newStatus] || `Status updated to ${newStatus}`;

  order.status = newStatus;
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note
  });

  await order.save();

  // Emit WebSocket event to the order room
  emitOrderStatusUpdate(orderId.toString(), order.toObject(), note);

  return order;
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  claimGuestOrders,
  getOrdersBatch,
  getAllOrders,
  updateOrderStatus
};

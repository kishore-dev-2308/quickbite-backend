const orderService = require('../services/orderService');
const simulationService = require('../services/simulationService');

const createOrder = async (req, res, next) => {
  try {
    // Role-based restriction: Kitchen staff and admins manage orders and cannot place customer orders
    if (req.user && ['admin', 'kitchen', 'kitchen_staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kitchen staff and administrative accounts cannot place delivery orders. Please sign in with a customer account or place orders as a guest.'
      });
    }

    const userId = req.user ? req.user._id : null;
    const order = await orderService.createOrder(req.body, userId);

    // Orders remain in initial status ("Order Received") and are manually updated by kitchen staff

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order
      }
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Strict ownership verification: If order has an owner, only owner or staff can view it
    if (order.user && req.user) {
      const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
      const isOwner = orderUserId === req.user._id.toString();
      const isStaff = ['admin', 'kitchen', 'kitchen_staff'].includes(req.user.role);
      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this order.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        order
      }
    });
  } catch (err) {
    next(err);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

const claimGuestOrders = async (req, res, next) => {
  try {
    if (req.user && ['admin', 'kitchen', 'kitchen_staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Kitchen staff and administrative accounts cannot claim customer orders.'
      });
    }

    const { orderIds } = req.body;
    const result = await orderService.claimGuestOrders(orderIds, req.user._id, req.user);

    res.status(200).json({
      success: true,
      message: `Successfully claimed ${result.claimedCount} orders`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const getOrdersBatch = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    const orders = await orderService.getOrdersBatch(orderIds);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, note);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });
  } catch (err) {
    next(err);
  }
};

const simulateStatus = async (req, res, next) => {
  try {
    const result = await simulationService.advanceOrderToNextStatus(req.params.id);

    res.status(200).json({
      success: result.success,
      message: result.message || `Order advanced to "${result.newStatus}"`,
      data: {
        order: result.order,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  claimGuestOrders,
  getOrdersBatch,
  getAllOrders,
  updateOrderStatus,
  simulateStatus
};

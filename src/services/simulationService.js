const Order = require('../models/Order');
const { NEXT_STATUS_MAP } = require('../config/constants');
const { updateOrderStatus } = require('./orderService');

// Active timer trackers to prevent memory leaks or duplicate chains
const activeSimulations = new Map();

/**
 * Manually or programmatically advance an order to the next sequential status
 */
const advanceOrderToNextStatus = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const nextStatus = NEXT_STATUS_MAP[order.status];
  if (!nextStatus) {
    return {
      success: false,
      message: `Order is already at final state: "${order.status}"`,
      order
    };
  }

  const updatedOrder = await updateOrderStatus(orderId, nextStatus);
  return {
    success: true,
    previousStatus: order.status,
    newStatus: updatedOrder.status,
    order: updatedOrder
  };
};

/**
 * Automatically advances an order through its lifecycle:
 * Order Received (0s) -> Preparing (+7s) -> Out for Delivery (+14s) -> Delivered (+21s)
 */
const scheduleAutomaticProgression = (orderId, stepIntervalMs = 7000) => {
  // Do not run automated timers in test mode unless explicitly requested
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (activeSimulations.has(orderId.toString())) {
    clearTimeout(activeSimulations.get(orderId.toString()));
  }

  const runStep = async () => {
    try {
      const result = await advanceOrderToNextStatus(orderId);
      if (result.success && NEXT_STATUS_MAP[result.newStatus]) {
        // Schedule next step
        const timer = setTimeout(runStep, stepIntervalMs);
        activeSimulations.set(orderId.toString(), timer);
      } else {
        // Finished simulation
        activeSimulations.delete(orderId.toString());
      }
    } catch (err) {
      console.warn(`[Simulation Service] Error during simulated progression: ${err.message}`);
      activeSimulations.delete(orderId.toString());
    }
  };

  const initialTimer = setTimeout(runStep, stepIntervalMs);
  activeSimulations.set(orderId.toString(), initialTimer);
  console.log(`[Simulation Service] Scheduled auto-progression for order ${orderId} every ${stepIntervalMs / 1000}s`);
};

/**
 * Cancel an active simulation for an order
 */
const cancelSimulation = (orderId) => {
  const idStr = orderId.toString();
  if (activeSimulations.has(idStr)) {
    clearTimeout(activeSimulations.get(idStr));
    activeSimulations.delete(idStr);
  }
};

module.exports = {
  advanceOrderToNextStatus,
  scheduleAutomaticProgression,
  cancelSimulation
};

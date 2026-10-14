const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, optionalToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createOrderValidation, updateStatusValidation } = require('../middleware/validationMiddleware');
const { ROLES } = require('../config/constants');

// Create order (supports authenticated or guest users)
router.post('/', optionalToken, createOrderValidation, orderController.createOrder);

// Get orders for current logged in user
router.get('/', verifyToken, orderController.getUserOrders);

// Admin: Get all orders across the system
router.get('/all', verifyToken, authorizeRoles(ROLES.ADMIN), orderController.getAllOrders);

// Claim guest orders placed on this device after user logs in/registers
router.post('/claim', verifyToken, orderController.claimGuestOrders);

// Batch retrieve orders by ID (for guests viewing recent orders on device)
router.post('/batch', orderController.getOrdersBatch);

// Get single order details
router.get('/:id', optionalToken, orderController.getOrderById);

// Admin: Update order status manually
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  updateStatusValidation,
  orderController.updateOrderStatus
);

// Reviewer / Demo: Advance status simulation
router.post('/:id/simulate', orderController.simulateStatus);

module.exports = router;

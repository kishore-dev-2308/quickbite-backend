const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createMenuItemValidation } = require('../middleware/validationMiddleware');
const { ROLES } = require('../config/constants');

// Public endpoints
router.get('/', menuController.getMenuItems);
router.get('/:id', menuController.getMenuItemById);

// Admin-protected endpoints
router.post(
  '/',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  createMenuItemValidation,
  menuController.createMenuItem
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  menuController.updateMenuItem
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  menuController.deleteMenuItem
);

module.exports = router;

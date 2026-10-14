const { body, param, validationResult } = require('express-validator');
const { ORDER_STATUSES } = require('../config/constants');

/**
 * Middleware that inspects validationResult and responds with 400 if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const createOrderValidation = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerPhone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone number is required'),
  body('deliveryAddress')
    .trim()
    .notEmpty()
    .withMessage('Delivery address is required')
    .isLength({ min: 5, max: 300 })
    .withMessage('Delivery address must be between 5 and 300 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Cart must contain at least one item'),
  body('items.*.menuItemId')
    .isMongoId()
    .withMessage('Each item must have a valid menuItemId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be a positive integer'),
  validate
];

const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Order ID format'),
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage(`Status must be one of: [${ORDER_STATUSES.join(', ')}]`),
  validate
];

const createMenuItemValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('image').trim().isURL().withMessage('Image must be a valid URL'),
  body('category').isIn(['Pizza', 'Burger', 'Drinks', 'Dessert', 'Sides']).withMessage('Invalid category'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createOrderValidation,
  updateStatusValidation,
  createMenuItemValidation
};

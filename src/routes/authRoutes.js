const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', verifyToken, authController.getProfile);

module.exports = router;

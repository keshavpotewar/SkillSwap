const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { register, login, getCurrentUser, verifyToken } = require('../controllers/authController');

// Register new user
router.post('/register', validateRegistration, register);

// Login user
router.post('/login', validateLogin, login);

// Get current user
router.get('/me', auth, getCurrentUser);

// Verify token
router.get('/verify', auth, verifyToken);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { validateBanUser, validatePlatformMessage } = require('../middleware/validation');
const {
  getPlatformStats,
  banUser,
  unbanUser,
  getBannedUsers,
  addPlatformMessage,
  getAllSwapRequests,
  exportData,
  getUserActivityReport,
  moderateSkill
} = require('../controllers/adminController');

// All admin routes require admin authentication
router.use(adminAuth);

// Get platform statistics
router.get('/stats', getPlatformStats);

// Get all swap requests (admin view)
router.get('/swaps', getAllSwapRequests);

// Get banned users
router.get('/banned-users', getBannedUsers);

// Ban user
router.post('/ban-user', validateBanUser, banUser);

// Unban user
router.put('/unban-user/:userId', unbanUser);

// Add platform message
router.post('/platform-message', validatePlatformMessage, addPlatformMessage);

// Export data to CSV
router.get('/export', exportData);

// Get user activity report
router.get('/user-activity/:userId', getUserActivityReport);

// Moderate skill
router.post('/moderate-skill', moderateSkill);

module.exports = router; 
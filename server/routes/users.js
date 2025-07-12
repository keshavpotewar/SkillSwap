const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validateFeedback } = require('../middleware/validation');
const {
  getUsers,
  getUserById,
  updateProfile,
  uploadProfilePhoto,
  addFeedback,
  getUserSkills,
  searchUsersBySkill
} = require('../controllers/userController');

// Get all users (with search and filters)
router.get('/', optionalAuth, getUsers);

// Search users by skill
router.get('/search/skill', optionalAuth, searchUsersBySkill);

// Get user by ID
router.get('/:id', optionalAuth, getUserById);

// Get user's skills
router.get('/:id/skills', getUserSkills);

// Update user profile (authenticated)
router.put('/profile', auth, validateProfileUpdate, updateProfile);

// Upload profile photo (authenticated)
router.put('/profile/photo', auth, uploadProfilePhoto);

// Add feedback to user (authenticated)
router.post('/:userId/feedback', auth, validateFeedback, addFeedback);

module.exports = router; 
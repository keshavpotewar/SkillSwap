const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendMessage,
  getConversation,
  getRecentConversations,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');

// Send a message
router.post('/', auth, sendMessage);

// Get unread message count
router.get('/unread/count', auth, getUnreadCount);

// Get recent conversations
router.get('/', auth, getRecentConversations);

// Get conversation with a specific user
router.get('/:userId', auth, getConversation);

// Mark messages as read
router.put('/:userId/read', auth, markAsRead);

module.exports = router; 
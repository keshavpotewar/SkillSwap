const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(to);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if target user is banned
    if (targetUser.isBanned) {
      return res.status(400).json({ message: 'Cannot send message to banned user' });
    }

    // Check if target user's profile is private
    if (!targetUser.isPublic) {
      return res.status(403).json({ message: 'Cannot send message to private profile' });
    }

    // Check if user is trying to send message to themselves
    if (from.toString() === to) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Create new message
    const newMessage = new Message({
      from,
      to,
      message: message.trim()
    });

    await newMessage.save();

    // Populate user data for response
    await newMessage.populate('from', 'name profilePhoto');
    await newMessage.populate('to', 'name profilePhoto');

    // Send real-time notification
    const io = req.app.get('io');
    io.to(to.toString()).emit('newMessage', newMessage);

    res.status(201).json({
      message: 'Message sent successfully',
      message: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get conversation
    const messages = await Message.getConversation(currentUserId, userId, 50);

    res.json({
      messages: messages.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent conversations for current user
const getRecentConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.getRecentConversations(userId);

    res.json({
      conversations
    });
  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        from: userId,
        to: currentUserId,
        read: false
      },
      {
        read: true
      }
    );

    res.json({
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({
      to: userId,
      read: false
    });

    res.json({
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getRecentConversations,
  markAsRead,
  getUnreadCount
}; 
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Admin = require('../models/Admin');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const admin = await Admin.getOrCreate();
    
    // Get real-time stats
    const totalUsers = await User.countDocuments({ isBanned: false });
    const totalSwaps = await SwapRequest.countDocuments();
    const successfulSwaps = await SwapRequest.countDocuments({ status: 'Accepted' });
    const pendingSwaps = await SwapRequest.countDocuments({ status: 'Pending' });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Update admin stats
    await admin.updateStats({
      totalUsers,
      totalSwaps,
      successfulSwaps,
      lastUpdated: new Date()
    });

    res.json({
      stats: {
        totalUsers,
        totalSwaps,
        successfulSwaps,
        pendingSwaps,
        bannedUsers,
        successRate: totalSwaps > 0 ? Math.round((successfulSwaps / totalSwaps) * 100) : 0
      },
      platformMessages: admin.platformMessages.filter(msg => msg.isActive),
      skillCategories: admin.skillCategories.filter(cat => cat.isActive)
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ban user
const banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban admin users' });
    }

    const admin = await Admin.getOrCreate();
    await admin.banUser(userId, reason, adminId);

    // Update user's banned status
    user.isBanned = true;
    await user.save();

    res.json({ 
      message: 'User banned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    if (error.message === 'User is already banned') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Unban user
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = await Admin.getOrCreate();
    
    await admin.unbanUser(userId);

    // Update user's banned status
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User unbanned successfully',
      user
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get banned users
const getBannedUsers = async (req, res) => {
  try {
    const admin = await Admin.getOrCreate();
    
    const bannedUsers = await User.find({ isBanned: true })
      .select('name email location createdAt')
      .sort({ createdAt: -1 });

    res.json({ bannedUsers });
  } catch (error) {
    console.error('Get banned users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add platform message
const addPlatformMessage = async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;
    const adminId = req.user._id;

    const admin = await Admin.getOrCreate();
    await admin.addPlatformMessage(message, type, adminId);

    // Send real-time notification to all users
    const io = req.app.get('io');
    io.emit('platformMessage', {
      message,
      type,
      createdAt: new Date()
    });

    res.json({ 
      message: 'Platform message added successfully',
      platformMessage: {
        message,
        type,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Add platform message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all swap requests (admin view)
const getAllSwapRequests = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const swapRequests = await SwapRequest.find(query)
      .populate('fromUser', 'name email location')
      .populate('toUser', 'name email location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await SwapRequest.countDocuments(query);

    res.json({
      swapRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total
      }
    });
  } catch (error) {
    console.error('Get all swap requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export data to CSV
const exportData = async (req, res) => {
  try {
    const { type = 'users' } = req.query;

    if (type === 'users') {
      const users = await User.find({ isBanned: false })
        .select('name email location availability rating createdAt')
        .sort({ createdAt: -1 });

      const csvWriter = createCsvWriter({
        path: 'users_export.csv',
        header: [
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'location', title: 'Location' },
          { id: 'availability', title: 'Availability' },
          { id: 'rating', title: 'Rating' },
          { id: 'createdAt', title: 'Joined Date' }
        ]
      });

      await csvWriter.writeRecords(users);
      res.download('users_export.csv');
    } else if (type === 'swaps') {
      const swaps = await SwapRequest.find()
        .populate('fromUser', 'name email')
        .populate('toUser', 'name email')
        .sort({ createdAt: -1 });

      const csvData = swaps.map(swap => ({
        fromUser: swap.fromUser.name,
        fromEmail: swap.fromUser.email,
        toUser: swap.toUser.name,
        toEmail: swap.toUser.email,
        skillOffered: swap.skillOffered,
        skillWanted: swap.skillWanted,
        status: swap.status,
        createdAt: swap.createdAt
      }));

      const csvWriter = createCsvWriter({
        path: 'swaps_export.csv',
        header: [
          { id: 'fromUser', title: 'From User' },
          { id: 'fromEmail', title: 'From Email' },
          { id: 'toUser', title: 'To User' },
          { id: 'toEmail', title: 'To Email' },
          { id: 'skillOffered', title: 'Skill Offered' },
          { id: 'skillWanted', title: 'Skill Wanted' },
          { id: 'status', title: 'Status' },
          { id: 'createdAt', title: 'Created Date' }
        ]
      });

      await csvWriter.writeRecords(csvData);
      res.download('swaps_export.csv');
    } else {
      return res.status(400).json({ message: 'Invalid export type' });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user activity report
const getUserActivityReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's swap requests
    const sentRequests = await SwapRequest.countDocuments({ from: userId });
    const receivedRequests = await SwapRequest.countDocuments({ to: userId });
    const acceptedRequests = await SwapRequest.countDocuments({ 
      $or: [{ from: userId }, { to: userId }], 
      status: 'Accepted' 
    });

    // Get recent activity
    const recentSwaps = await SwapRequest.find({
      $or: [{ from: userId }, { to: userId }]
    })
    .populate('fromUser', 'name')
    .populate('toUser', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      user,
      activity: {
        sentRequests,
        receivedRequests,
        acceptedRequests,
        successRate: (sentRequests + receivedRequests) > 0 
          ? Math.round((acceptedRequests / (sentRequests + receivedRequests)) * 100) 
          : 0
      },
      recentSwaps
    });
  } catch (error) {
    console.error('Get user activity report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Moderate skill (admin can flag inappropriate skills)
const moderateSkill = async (req, res) => {
  try {
    const { userId, skillType, skillName, action } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'remove') {
      if (skillType === 'offered') {
        user.skillsOffered = user.skillsOffered.filter(skill => skill !== skillName);
      } else if (skillType === 'wanted') {
        user.skillsWanted = user.skillsWanted.filter(skill => skill !== skillName);
      }
      
      await user.save();
      
      res.json({ 
        message: 'Skill removed successfully',
        user: {
          _id: user._id,
          name: user.name,
          skillsOffered: user.skillsOffered,
          skillsWanted: user.skillsWanted
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Moderate skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPlatformStats,
  banUser,
  unbanUser,
  getBannedUsers,
  addPlatformMessage,
  getAllSwapRequests,
  exportData,
  getUserActivityReport,
  moderateSkill
}; 
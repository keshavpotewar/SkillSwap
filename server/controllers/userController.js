const User = require('../models/User');

// Get all users (with pagination and search)
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      availability = '', 
      skill = '',
      currentUserId 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isBanned: false };

    // Only show public profiles unless user is viewing their own profile
    if (!currentUserId) {
      query.isPublic = true;
    } else {
      query.$or = [
        { isPublic: true },
        { _id: currentUserId }
      ];
    }

    // Exclude current user from results
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    // Search by name or location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by availability
    if (availability) {
      query.availability = availability;
    }

    // Filter by skill (in skills offered or wanted)
    if (skill) {
      const skillQuery = {
        $or: [
          { skillsOffered: { $regex: skill, $options: 'i' } },
          { skillsWanted: { $regex: skill, $options: 'i' } }
        ]
      };
      
      // If there's already a $or query (from search), combine them with $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          skillQuery
        ];
        delete query.$or;
      } else {
        query.$or = skillQuery.$or;
      }
    }

    const users = await User.find(query)
      .select('name location profilePhoto skillsOffered skillsWanted availability rating createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ rating: -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('name location profilePhoto skillsOffered skillsWanted availability rating feedback createdAt isPublic')
      .populate('feedback.from', 'name profilePhoto');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is private and user is not the owner
    if (!user.isPublic && (!req.user || req.user._id.toString() !== id)) {
      return res.status(403).json({ 
        message: 'This profile is private',
        isPrivate: true 
      });
    }

    // Calculate current rating
    const currentRating = user.calculateAverageRating();
    if (currentRating !== user.rating) {
      user.rating = currentRating;
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, location, availability, skillsOffered, skillsWanted, isPublic } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (availability) updateData.availability = availability;
    if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
  try {
    const { profilePhoto } = req.body;
    const userId = req.user._id;

    if (!profilePhoto) {
      return res.status(400).json({ message: 'Profile photo is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile photo updated successfully',
      user 
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add feedback to user
const addFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, message } = req.body;
    const fromUserId = req.user._id;

    console.log('Feedback request:', { userId, rating, message, fromUserId });

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to give feedback to themselves
    if (userId === fromUserId.toString()) {
      return res.status(400).json({ message: 'Cannot give feedback to yourself' });
    }

    // Check if feedback already exists from this user
    const existingFeedback = user.feedback.find(f => f.from.toString() === fromUserId.toString());
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already given feedback to this user' });
    }

    // Add feedback
    user.feedback.push({
      message,
      rating,
      from: fromUserId
    });

    // Recalculate average rating
    user.rating = user.calculateAverageRating();

    await user.save();

    console.log('Feedback saved successfully:', { rating: user.rating, feedbackCount: user.feedback.length });

    res.json({ 
      message: 'Feedback added successfully',
      user: {
        _id: user._id,
        rating: user.rating,
        feedback: user.feedback
      }
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's skills
const getUserSkills = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('skillsOffered skillsWanted');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search users by skill
const searchUsersBySkill = async (req, res) => {
  try {
    const { skill, type = 'both' } = req.query;
    const { currentUserId } = req.query;

    if (!skill) {
      return res.status(400).json({ message: 'Skill parameter is required' });
    }

    let query = { isPublic: true, isBanned: false };

    // Exclude current user
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    // Search based on type
    if (type === 'offered') {
      query.skillsOffered = { $regex: skill, $options: 'i' };
    } else if (type === 'wanted') {
      query.skillsWanted = { $regex: skill, $options: 'i' };
    } else {
      query.$or = [
        { skillsOffered: { $regex: skill, $options: 'i' } },
        { skillsWanted: { $regex: skill, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name location profilePhoto skillsOffered skillsWanted availability rating')
      .sort({ rating: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Search users by skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  uploadProfilePhoto,
  addFeedback,
  getUserSkills,
  searchUsersBySkill
}; 
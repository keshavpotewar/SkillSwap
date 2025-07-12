const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      location
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      profilePhoto: user.profilePhoto,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      availability: user.availability,
      isPublic: user.isPublic,
      role: user.role,
      rating: user.rating,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      profilePhoto: user.profilePhoto,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      availability: user.availability,
      isPublic: user.isPublic,
      role: user.role,
      rating: user.rating,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify token
const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    res.json({ 
      valid: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        profilePhoto: user.profilePhoto,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        availability: user.availability,
        isPublic: user.isPublic,
        role: user.role,
        rating: user.rating,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  verifyToken
}; 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  skillsOffered: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  skillsWanted: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  availability: {
    type: String,
    enum: ['Available', 'Busy', 'Away', 'Not Available'],
    default: 'Available'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  feedback: [{
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Feedback message cannot exceed 500 characters']
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate average rating
userSchema.methods.calculateAverageRating = function() {
  if (this.feedback.length === 0) return 0;
  
  const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  return Math.round((totalRating / this.feedback.length) * 10) / 10;
};

// Virtual for public profile (excludes sensitive data)
userSchema.virtual('publicProfile').get(function() {
  return {
    _id: this._id,
    name: this.name,
    location: this.location,
    profilePhoto: this.profilePhoto,
    skillsOffered: this.skillsOffered,
    skillsWanted: this.skillsWanted,
    availability: this.availability,
    rating: this.rating,
    feedback: this.feedback,
    createdAt: this.createdAt
  };
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 
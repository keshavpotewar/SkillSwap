const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: [200, 'Ban reason cannot exceed 200 characters']
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bannedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    }
  }],
  platformMessages: [{
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Platform message cannot exceed 500 characters']
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'announcement'],
      default: 'info'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  platformStats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalSwaps: {
      type: Number,
      default: 0
    },
    successfulSwaps: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  skillCategories: [{
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: [200, 'Category description cannot exceed 200 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
adminSchema.index({ 'bannedUsers.user': 1 });
adminSchema.index({ 'platformMessages.isActive': 1 });

// Static method to get or create admin settings
adminSchema.statics.getOrCreate = async function() {
  let admin = await this.findOne();
  if (!admin) {
    admin = new this({
      platformStats: {
        totalUsers: 0,
        totalSwaps: 0,
        successfulSwaps: 0,
        lastUpdated: new Date()
      },
      skillCategories: [
        { name: 'Technology', description: 'Programming, web development, etc.' },
        { name: 'Languages', description: 'Language learning and teaching' },
        { name: 'Arts', description: 'Music, painting, crafts, etc.' },
        { name: 'Sports', description: 'Fitness, sports, outdoor activities' },
        { name: 'Business', description: 'Marketing, finance, management' },
        { name: 'Education', description: 'Tutoring, academic subjects' },
        { name: 'Other', description: 'Miscellaneous skills' }
      ]
    });
    await admin.save();
  }
  return admin;
};

// Method to add banned user
adminSchema.methods.banUser = async function(userId, reason, bannedBy) {
  const existingBan = this.bannedUsers.find(ban => ban.user.toString() === userId.toString());
  if (existingBan) {
    throw new Error('User is already banned');
  }
  
  this.bannedUsers.push({
    user: userId,
    reason,
    bannedBy,
    bannedAt: new Date()
  });
  
  return await this.save();
};

// Method to unban user
adminSchema.methods.unbanUser = async function(userId) {
  this.bannedUsers = this.bannedUsers.filter(ban => ban.user.toString() !== userId.toString());
  return await this.save();
};

// Method to add platform message
adminSchema.methods.addPlatformMessage = async function(message, type, createdBy) {
  this.platformMessages.push({
    message,
    type,
    createdBy,
    createdAt: new Date()
  });
  
  return await this.save();
};

// Method to update platform stats
adminSchema.methods.updateStats = async function(stats) {
  this.platformStats = {
    ...this.platformStats,
    ...stats,
    lastUpdated: new Date()
  };
  
  return await this.save();
};

module.exports = mongoose.model('Admin', adminSchema); 
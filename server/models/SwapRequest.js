const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From user is required']
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'To user is required']
  },
  skillOffered: {
    type: String,
    required: [true, 'Skill offered is required'],
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  },
  skillWanted: {
    type: String,
    required: [true, 'Skill wanted is required'],
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    message: {
      type: String,
      maxlength: [300, 'Feedback message cannot exceed 300 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
swapRequestSchema.index({ from: 1, to: 1 });
swapRequestSchema.index({ status: 1 });
swapRequestSchema.index({ createdAt: -1 });

// Virtual for populated data
swapRequestSchema.virtual('fromUser', {
  ref: 'User',
  localField: 'from',
  foreignField: '_id',
  justOne: true
});

swapRequestSchema.virtual('toUser', {
  ref: 'User',
  localField: 'to',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are populated
swapRequestSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to prevent self-swap requests
swapRequestSchema.pre('save', function(next) {
  if (this.from.toString() === this.to.toString()) {
    return next(new Error('Cannot create swap request to yourself'));
  }
  next();
});

// Static method to get swap requests with populated user data
swapRequestSchema.statics.getWithUsers = function(query = {}) {
  return this.find(query)
    .populate('fromUser', 'name location profilePhoto rating')
    .populate('toUser', 'name location profilePhoto rating')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('SwapRequest', swapRequestSchema); 
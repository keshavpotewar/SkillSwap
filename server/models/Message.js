const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ from: 1, to: 1, createdAt: -1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 50) {
  return this.find({
    $or: [
      { from: user1Id, to: user2Id },
      { from: user2Id, to: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('from', 'name profilePhoto')
  .populate('to', 'name profilePhoto');
};

// Static method to get recent conversations for a user
messageSchema.statics.getRecentConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { from: mongoose.Types.ObjectId(userId) },
          { to: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$from', mongoose.Types.ObjectId(userId)] },
            '$to',
            '$from'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);

  return this.populate(conversations, [
    { path: '_id', select: 'name profilePhoto' },
    { path: 'lastMessage.from', select: 'name profilePhoto' },
    { path: 'lastMessage.to', select: 'name profilePhoto' }
  ]);
};

module.exports = mongoose.model('Message', messageSchema); 
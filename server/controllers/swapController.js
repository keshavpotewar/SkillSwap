const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');

// Create swap request
const createSwapRequest = async (req, res) => {
  try {
    const { to, skillOffered, skillWanted, message } = req.body;
    const from = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(to);
    console.log('DEBUG: targetUser for swap request:', targetUser);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if target user is banned
    if (targetUser.isBanned) {
      return res.status(400).json({ message: 'Cannot send request to banned user' });
    }

    // Debug log for privacy
    console.log('DEBUG: targetUser.isPublic =', targetUser.isPublic);
    // Check if target user is public

    // Check if user is trying to send request to themselves
    if (from.toString() === to) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if request already exists
    const existingRequest = await SwapRequest.findOne({
      from,
      to,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists with this user' });
    }

    // Create new swap request
    const swapRequest = new SwapRequest({
      from,
      to,
      skillOffered,
      skillWanted,
      message
    });

    await swapRequest.save();

    // Populate user data for response
    await swapRequest.populate('fromUser', 'name location profilePhoto rating');
    await swapRequest.populate('toUser', 'name location profilePhoto rating');

    // Send real-time notification
    const io = req.app.get('io');
    io.to(to.toString()).emit('newSwapRequest', {
      swapRequest,
      message: `New swap request from ${req.user.name}`
    });

    res.status(201).json({
      message: 'Swap request sent successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's swap requests (incoming and outgoing)
const getSwapRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'all', status = '' } = req.query;

    let query = {};
    
    if (type === 'incoming') {
      query.to = userId;
    } else if (type === 'outgoing') {
      query.from = userId;
    } else {
      // For 'all' type, get both incoming and outgoing
      query.$or = [{ from: userId }, { to: userId }];
    }

    if (status) {
      query.status = status;
    }

    const swapRequests = await SwapRequest.getWithUsers(query);

    res.json({ swapRequests });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept swap request
const acceptSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the recipient
    if (swapRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only accept requests sent to you' });
    }

    // Check if request is already processed
    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update status
    swapRequest.status = 'Accepted';
    await swapRequest.save();

    // Populate user data
    await swapRequest.populate('fromUser', 'name location profilePhoto rating');
    await swapRequest.populate('toUser', 'name location profilePhoto rating');

    // Send real-time notification
    const io = req.app.get('io');
    io.to(swapRequest.from.toString()).emit('swapRequestAccepted', {
      swapRequest,
      message: `${req.user.name} accepted your swap request`
    });

    res.json({
      message: 'Swap request accepted successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject swap request
const rejectSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the recipient
    if (swapRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only reject requests sent to you' });
    }

    // Check if request is already processed
    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update status
    swapRequest.status = 'Rejected';
    await swapRequest.save();

    // Populate user data
    await swapRequest.populate('fromUser', 'name location profilePhoto rating');
    await swapRequest.populate('toUser', 'name location profilePhoto rating');

    // Send real-time notification
    const io = req.app.get('io');
    io.to(swapRequest.from.toString()).emit('swapRequestRejected', {
      swapRequest,
      message: `${req.user.name} rejected your swap request`
    });

    res.json({
      message: 'Swap request rejected successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete swap request (only by sender)
const deleteSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is the sender
    if (swapRequest.from.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete requests you sent' });
    }

    // Check if request is already accepted/rejected
    if (swapRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete processed request' });
    }

    await SwapRequest.findByIdAndDelete(id);

    // Send real-time notification
    const io = req.app.get('io');
    io.to(swapRequest.to.toString()).emit('swapRequestDeleted', {
      swapRequestId: id,
      message: `${req.user.name} cancelled their swap request`
    });

    res.json({ message: 'Swap request deleted successfully' });
  } catch (error) {
    console.error('Delete swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add feedback to completed swap
const addSwapFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, message } = req.body;
    const userId = req.user._id;

    const swapRequest = await SwapRequest.findById(id);
    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is part of the swap
    if (swapRequest.from.toString() !== userId.toString() && 
        swapRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only add feedback to your swaps' });
    }

    // Check if swap is completed
    if (swapRequest.status !== 'Accepted') {
      return res.status(400).json({ message: 'Can only add feedback to accepted swaps' });
    }

    // Check if feedback already exists
    if (swapRequest.feedback.rating) {
      return res.status(400).json({ message: 'Feedback already exists for this swap' });
    }

    // Add feedback
    swapRequest.feedback = {
      rating,
      message,
      createdAt: new Date()
    };

    await swapRequest.save();

    res.json({
      message: 'Feedback added successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Add swap feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get swap request by ID
const getSwapRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const swapRequest = await SwapRequest.findById(id)
      .populate('fromUser', 'name location profilePhoto rating')
      .populate('toUser', 'name location profilePhoto rating');

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is part of the swap
    if (swapRequest.from.toString() !== userId.toString() && 
        swapRequest.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ swapRequest });
  } catch (error) {
    console.error('Get swap request by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSwapRequest,
  getSwapRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  deleteSwapRequest,
  addSwapFeedback,
  getSwapRequestById
}; 
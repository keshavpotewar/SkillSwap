const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateSwapRequest } = require('../middleware/validation');
const {
  createSwapRequest,
  getSwapRequests,
  acceptSwapRequest,
  rejectSwapRequest,
  deleteSwapRequest,
  addSwapFeedback,
  getSwapRequestById
} = require('../controllers/swapController');

// Create new swap request
router.post('/', auth, validateSwapRequest, createSwapRequest);

// Get user's swap requests (incoming/outgoing/all)
router.get('/', auth, getSwapRequests);

// Get specific swap request
router.get('/:id', auth, getSwapRequestById);

// Accept swap request
router.put('/:id/accept', auth, acceptSwapRequest);

// Reject swap request
router.put('/:id/reject', auth, rejectSwapRequest);

// Delete swap request (only by sender)
router.delete('/:id', auth, deleteSwapRequest);

// Add feedback to completed swap
router.post('/:id/feedback', auth, addSwapFeedback);

module.exports = router; 
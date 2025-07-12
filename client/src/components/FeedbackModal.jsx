import React from 'react';
import { FiX, FiStar } from 'react-icons/fi';

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  user, 
  feedbackForm, 
  setFeedbackForm, 
  submitting, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Leave Feedback for {user?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={feedbackForm.rating}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Very Good</option>
              <option value={3}>3 - Good</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Share your experience with this user..."
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiStar className="mr-2" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal; 
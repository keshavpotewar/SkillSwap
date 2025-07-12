import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiStar, FiClock, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import SwapRequestModal from '../components/SwapRequestModal';
import ChatModal from '../components/ChatModal';
import FeedbackModal from '../components/FeedbackModal';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    skillOffered: '',
    skillWanted: '',
    message: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.data?.isPrivate) {
        toast.error('This profile is private');
      } else {
        toast.error('Failed to load user profile');
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);



  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`/api/users/${id}/feedback`, feedbackForm);
      console.log('Feedback response:', response.data);
      toast.success('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      setFeedbackForm({ rating: 5, message: '' });
      fetchUser(); // Refresh user data to show new feedback
    } catch (error) {
      console.error('Error submitting feedback:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit feedback');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'Busy': return 'text-yellow-600 bg-yellow-100';
      case 'Away': return 'text-orange-600 bg-orange-100';
      case 'Not Available': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back
      </button>

      {/* User Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <FiUser className="text-primary-600 text-3xl" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <FiMapPin className="mr-1" />
                  {user.location}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FiStar className="text-yellow-400 mr-1" />
                  <span className="font-semibold">{user.rating || 0}</span>
                </div>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(user.availability)}`}>
                  <FiClock className="mr-1" />
                  {user.availability}
                </span>
              </div>
            </div>

            {currentUser && currentUser._id !== user._id && user.isPublic && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSwapModal(true)}
                  className="btn-primary"
                >
                  <FiMessageSquare className="mr-2" />
                  Request Swap
                </button>
                <button
                  onClick={() => setShowChatModal(true)}
                  className="btn-secondary"
                >
                  <FiMessageSquare className="mr-2" />
                  Message
                </button>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="btn-secondary"
                >
                  <FiStar className="mr-2" />
                  Leave Feedback
                </button>
              </div>
            )}
            
            {currentUser && currentUser._id !== user._id && !user.isPublic && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  This profile is private. You can only view public information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Offered */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Offered</h2>
          <div className="flex flex-wrap gap-2">
            {user.skillsOffered && user.skillsOffered.length > 0 ? (
              user.skillsOffered.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills offered yet</p>
            )}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Wanted</h2>
          <div className="flex flex-wrap gap-2">
            {user.skillsWanted && user.skillsWanted.length > 0 ? (
              user.skillsWanted.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mr-2 mb-2">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills wanted yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {user.feedback && user.feedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
          <div className="space-y-4">
            {user.feedback.map((feedback, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      {feedback.from && feedback.from.profilePhoto ? (
                        <img
                          src={feedback.from.profilePhoto}
                          alt={feedback.from.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-blue-600 text-sm" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{feedback.from ? feedback.from.name : 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center">
                    <FiStar className="text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{feedback.rating}</span>
                  </div>
                </div>
                <p className="text-gray-700">{feedback.message}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <SwapRequestModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          targetUser={user}
          onSuccess={() => {
            setShowSwapModal(false);
            toast.success('Swap request sent successfully!');
          }}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          otherUser={user}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          user={user}
          feedbackForm={feedbackForm}
          setFeedbackForm={setFeedbackForm}
          submitting={submitting}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default UserDetail; 
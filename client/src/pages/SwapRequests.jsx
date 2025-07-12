import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiMessageSquare, FiCheck, FiX, FiTrash2, FiClock, FiStar } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const SwapRequests = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [processing, setProcessing] = useState(null);

  const fetchSwapRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/swaps?type=${activeTab}`);
      console.log('Swap requests response:', response.data);
      setSwapRequests(response.data.swapRequests || []);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
      toast.error('Failed to load swap requests');
      setSwapRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSwapRequests();
  }, [fetchSwapRequests]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('newSwapRequest', (data) => {
        toast.success(data.message);
        fetchSwapRequests();
      });

      socket.on('swapRequestAccepted', (data) => {
        toast.success(data.message);
        fetchSwapRequests();
      });

      socket.on('swapRequestRejected', (data) => {
        toast.success(data.message);
        fetchSwapRequests();
      });

      return () => {
        socket.off('newSwapRequest');
        socket.off('swapRequestAccepted');
        socket.off('swapRequestRejected');
      };
    }
  }, [socket, fetchSwapRequests]);

  const handleAccept = async (requestId) => {
    setProcessing(requestId);
    try {
      await axios.put(`/api/swaps/${requestId}/accept`);
      toast.success('Swap request accepted!');
      fetchSwapRequests();
    } catch (error) {
      console.error('Error accepting swap request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(requestId);
    try {
      await axios.put(`/api/swaps/${requestId}/reject`);
      toast.success('Swap request rejected');
      fetchSwapRequests();
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    setProcessing(requestId);
    try {
      await axios.delete(`/api/swaps/${requestId}`);
      toast.success('Swap request deleted');
      fetchSwapRequests();
    } catch (error) {
      console.error('Error deleting swap request:', error);
      toast.error(error.response?.data?.message || 'Failed to delete request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'Accepted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Accepted</span>;
      case 'Rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{status}</span>;
    }
  };

  const getOtherUser = (request) => {
    return activeTab === 'incoming' ? request.fromUser : request.toUser;
  };

  if (loading) {
    return <LoadingSpinner text="Loading swap requests..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Swap Requests</h1>
        <p className="text-gray-600 mt-2">Manage your incoming and outgoing swap requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'incoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incoming Requests ({swapRequests.filter(r => r.to === user?._id).length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'outgoing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Outgoing Requests ({swapRequests.filter(r => r.from === user?._id).length})
          </button>
        </nav>
      </div>

      {/* Swap Requests List */}
      {swapRequests.length === 0 ? (
        <div className="text-center py-12">
          <FiMessageSquare className="mx-auto text-gray-400 text-6xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} swap requests
          </h3>
          <p className="text-gray-600">
            {activeTab === 'incoming' 
              ? 'You don\'t have any incoming swap requests at the moment.'
              : 'You haven\'t sent any swap requests yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {swapRequests
            .filter(request => {
              if (activeTab === 'incoming') {
                return request.to === user._id;
              } else if (activeTab === 'outgoing') {
                return request.from === user._id;
              }
              return true;
            })
            .map((request) => {
            const otherUser = getOtherUser(request);
            return (
              <div key={request._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {otherUser?.profilePhoto ? (
                        <img
                          src={otherUser.profilePhoto}
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-blue-600 text-xl" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {otherUser?.name || 'Unknown User'}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">You offer:</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                            {request.skillOffered}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">You want:</p>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mr-2 mb-2">
                            {request.skillWanted}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Message:</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {request.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {request.status === 'Pending' && activeTab === 'incoming' && (
                      <>
                        <button
                          onClick={() => handleAccept(request._id)}
                          disabled={processing === request._id}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm px-3 py-1 disabled:opacity-50"
                        >
                          {processing === request._id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiCheck className="w-3 h-3 mr-1" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          disabled={processing === request._id}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm px-3 py-1 disabled:opacity-50"
                        >
                          {processing === request._id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiX className="w-3 h-3 mr-1" />
                              Reject
                            </>
                          )}
                        </button>
                      </>
                    )}
                    
                    {request.status === 'Pending' && activeTab === 'outgoing' && (
                      <button
                        onClick={() => handleDelete(request._id)}
                        disabled={processing === request._id}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm px-3 py-1 disabled:opacity-50"
                      >
                        {processing === request._id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FiTrash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                    
                    {request.status === 'Accepted' && (
                      <div className="text-center">
                        <FiStar className="text-yellow-400 text-xl mx-auto mb-1" />
                        <span className="text-sm text-green-600 font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SwapRequests; 
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiClock, FiStar, FiSearch, FiMessageSquare } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import SwapRequestModal from '../components/SwapRequestModal';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(availabilityFilter && { availability: availabilityFilter }),
        ...(skillFilter && { skill: skillFilter })
      });

      const response = await axios.get(`/api/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, availabilityFilter, skillFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewProfile = (userId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/user/${userId}`);
  };

  const handleRequestSwap = (userItem) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedUser(userItem);
    setSwapModalOpen(true);
  };

  const handleSwapSuccess = () => {
    // Refresh the page or update the UI as needed
    fetchUsers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAvailabilityFilter('');
    setSkillFilter('');
    setCurrentPage(1);
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

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Skill Swap
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with others to exchange skills and knowledge
        </p>
        {!user && (
          <div className="space-x-4">
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Away">Away</option>
              <option value="Not Available">Not Available</option>
            </select>

            <input
              type="text"
              placeholder="Filter by skill..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="input-field"
            />

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary flex-1">
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Users Grid */}
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {users.map((userItem) => (
              <div key={userItem._id} className="card-hover">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    {userItem.profilePhoto ? (
                      <img
                        src={userItem.profilePhoto}
                        alt={userItem.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-primary-600 text-xl" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{userItem.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiMapPin className="mr-1" />
                      {userItem.location}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${getAvailabilityColor(userItem.availability)}`}>
                      <FiClock className="mr-1" />
                      {userItem.availability}
                    </span>
                    <div className="flex items-center">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{userItem.rating || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Offered:</h4>
                  <div className="flex flex-wrap">
                    {userItem.skillsOffered.slice(0, 3).map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                    {userItem.skillsOffered.length > 3 && (
                      <span className="skill-tag">+{userItem.skillsOffered.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted:</h4>
                  <div className="flex flex-wrap">
                    {userItem.skillsWanted.slice(0, 3).map((skill, index) => (
                      <span key={index} className="skill-tag-wanted">
                        {skill}
                      </span>
                    ))}
                    {userItem.skillsWanted.length > 3 && (
                      <span className="skill-tag-wanted">+{userItem.skillsWanted.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewProfile(userItem._id)}
                    className="btn-secondary flex-1 text-center"
                  >
                    View Profile
                  </button>
                  {user && user._id !== userItem._id && (
                    <button
                      onClick={() => handleRequestSwap(userItem)}
                      className="btn-primary flex-1"
                    >
                      Request Swap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-12">
              <FiUser className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}

      {/* Swap Request Modal */}
      {selectedUser && (
        <SwapRequestModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSelectedUser(null);
          }}
          targetUser={selectedUser}
          onSuccess={handleSwapSuccess}
        />
      )}
    </div>
  );
};

export default Home; 
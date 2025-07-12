import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiMessageSquare, FiCheckCircle, FiXCircle, FiShield, 
  FiTrendingUp, FiDownload, FiUserX, FiUserCheck, FiAlertTriangle 
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [platformMessage, setPlatformMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, swapsRes, bannedRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/swaps'),
        axios.get('/api/admin/banned-users')
      ]);
      
      setStats(statsRes.data.stats);
      setSwapRequests(swapsRes.data.swapRequests);
      setBannedUsers(bannedRes.data.bannedUsers);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, reason) => {
    try {
      await axios.post('/api/admin/ban-user', { userId, reason });
      toast.success('User banned successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(error.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await axios.put(`/api/admin/unban-user/${userId}`);
      toast.success('User unbanned successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleSendPlatformMessage = async (e) => {
    e.preventDefault();
    if (!platformMessage.trim()) return;

    setSendingMessage(true);
    try {
      await axios.post('/api/admin/platform-message', {
        message: platformMessage,
        type: messageType
      });
      toast.success('Platform message sent successfully');
      setPlatformMessage('');
      setMessageType('info');
    } catch (error) {
      console.error('Error sending platform message:', error);
      toast.error('Failed to send platform message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleExportData = async (type) => {
    try {
      const response = await axios.get(`/api/admin/export?type=${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage the Skill Swap platform</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiMessageSquare className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Swaps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSwaps}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiCheckCircle className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiUserX className="text-red-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Banned Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bannedUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'swaps', 'users', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Swap Requests */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Swap Requests</h2>
            <div className="space-y-3">
              {swapRequests.slice(0, 5).map((request) => (
                <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.fromUser.name} → {request.toUser.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.skillOffered} for {request.skillWanted}
                    </p>
                  </div>
                  <span className={`badge ${
                    request.status === 'Pending' ? 'badge-warning' :
                    request.status === 'Accepted' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleExportData('users')}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Export Users Data
              </button>
              <button
                onClick={() => handleExportData('swaps')}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Export Swaps Data
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'swaps' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Swap Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {swapRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.fromUser.name}</div>
                      <div className="text-sm text-gray-500">{request.fromUser.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.toUser.name}</div>
                      <div className="text-sm text-gray-500">{request.toUser.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="skill-tag">{request.skillOffered}</span>
                        <span className="mx-2">→</span>
                        <span className="skill-tag-wanted">{request.skillWanted}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Banned Users</h2>
          {bannedUsers.length === 0 ? (
            <p className="text-gray-500">No banned users</p>
          ) : (
            <div className="space-y-3">
              {bannedUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleUnbanUser(user._id)}
                    className="btn-success text-sm"
                  >
                    <FiUserCheck className="mr-1" />
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Platform Message</h2>
          <form onSubmit={handleSendPlatformMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="input-field"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={platformMessage}
                onChange={(e) => setPlatformMessage(e.target.value)}
                className="input-field"
                rows="4"
                placeholder="Enter your platform message..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={sendingMessage}
              className="btn-primary"
            >
              {sendingMessage ? (
                <div className="spinner w-4 h-4"></div>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Pending':
      return <span className="badge badge-warning">Pending</span>;
    case 'Accepted':
      return <span className="badge badge-success">Accepted</span>;
    case 'Rejected':
      return <span className="badge badge-danger">Rejected</span>;
    default:
      return <span className="badge badge-primary">{status}</span>;
  }
};

export default AdminDashboard; 
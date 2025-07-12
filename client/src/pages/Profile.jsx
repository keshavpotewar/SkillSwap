import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiClock, FiEye, FiEyeOff, FiPlus, FiX, FiUpload } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    availability: 'Available',
    isPublic: true,
    skillsOffered: [],
    skillsWanted: []
  });
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        location: user.location || '',
        availability: user.availability || 'Available',
        isPublic: user.isPublic !== undefined ? user.isPublic : true,
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || []
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !formData.skillsOffered.includes(newSkillOffered.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, newSkillOffered.trim()]
      }));
      setNewSkillOffered('');
    }
  };

  const removeSkillOffered = (index) => {
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter((_, i) => i !== index)
    }));
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !formData.skillsWanted.includes(newSkillWanted.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, newSkillWanted.trim()]
      }));
      setNewSkillWanted('');
    }
  };

  const removeSkillWanted = (index) => {
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.put('/api/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your profile information and skills</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your location"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Away">Away</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make profile public
              </label>
            </div>
          </div>
        </div>

        {/* Skills Offered */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills You Can Offer</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addSkillOffered)}
                className="input-field flex-1"
                placeholder="Add a skill you can offer"
              />
              <button
                type="button"
                onClick={addSkillOffered}
                className="btn-primary"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skillsOffered.map((skill, index) => (
              <span key={index} className="skill-tag flex items-center">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkillOffered(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.skillsOffered.length === 0 && (
              <p className="text-gray-500 text-sm">No skills added yet</p>
            )}
          </div>
        </div>

        {/* Skills Wanted */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills You Want to Learn</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillWanted}
                onChange={(e) => setNewSkillWanted(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addSkillWanted)}
                className="input-field flex-1"
                placeholder="Add a skill you want to learn"
              />
              <button
                type="button"
                onClick={addSkillWanted}
                className="btn-primary"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skillsWanted.map((skill, index) => (
              <span key={index} className="skill-tag-wanted flex items-center">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkillWanted(index)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.skillsWanted.length === 0 && (
              <p className="text-gray-500 text-sm">No skills wanted yet</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="spinner w-4 h-4 mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile; 
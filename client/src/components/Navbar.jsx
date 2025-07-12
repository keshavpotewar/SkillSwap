import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiShield } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Skill Swap</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/swap-requests" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Swap Requests
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <FiShield className="mr-1" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User menu and auth buttons */}
          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-primary-600" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiUser className="mr-3" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiLogOut className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {user && (
                <>
                  <Link
                    to="/swap-requests"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Swap Requests
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FiShield className="mr-2" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 
 
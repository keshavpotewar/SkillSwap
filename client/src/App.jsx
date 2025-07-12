import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserDetail from './pages/UserDetail';
import SwapRequests from './pages/SwapRequests';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('join', user._id);

      newSocket.on('newSwapRequest', (data) => {
        console.log('New swap request:', data);
      });

      newSocket.on('swapRequestAccepted', (data) => {
        console.log('Swap request accepted:', data);
      });

      newSocket.on('swapRequestRejected', (data) => {
        console.log('Swap request rejected:', data);
      });

      newSocket.on('platformMessage', (data) => {
        console.log('Platform message:', data);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketProvider socket={socket}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/user/:id" element={<UserDetail />} />
              <Route 
                path="/swap-requests" 
                element={
                  <ProtectedRoute>
                    <SwapRequests />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </SocketProvider>
  );
};

// App Component with Providers
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 
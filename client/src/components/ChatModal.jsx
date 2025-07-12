import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiUser } from 'react-icons/fi';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatModal = ({ isOpen, onClose, otherUser }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/${otherUser._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [otherUser._id]);

  useEffect(() => {
    if (isOpen && otherUser) {
      fetchMessages();
    }
  }, [isOpen, otherUser, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (data) => {
        if (data.from === otherUser?._id || data.to === otherUser?._id) {
          setMessages(prev => [...prev, data]);
        }
      });

      socket.on('userTyping', (data) => {
        if (data.userId === otherUser?._id) {
          setIsTyping(true);
        }
      });

      socket.on('userStoppedTyping', (data) => {
        if (data.userId === otherUser?._id) {
          setIsTyping(false);
        }
      });

      return () => {
        socket.off('newMessage');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
      };
    }
  }, [socket, otherUser]);

  const handleTyping = () => {
    if (socket && otherUser) {
      socket.emit('typing', { to: otherUser._id });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { to: otherUser._id });
      }, 1000);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        to: otherUser._id,
        message: newMessage.trim()
      };

      // Add message to UI immediately for better UX
      const tempMessage = {
        _id: Date.now().toString(),
        from: user._id,
        to: otherUser._id,
        message: newMessage.trim(),
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      const response = await axios.post('/api/messages', messageData);
      const sentMessage = response.data.message;

      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg._id === tempMessage._id ? { ...sentMessage, status: 'sent' } : msg
      ));

      // Emit message via socket for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
          to: otherUser._id,
          message: sentMessage
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg._id !== Date.now().toString()));
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              {otherUser?.profilePhoto ? (
                <img
                  src={otherUser.profilePhoto}
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
              <p className="text-sm text-green-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-gray-400 text-2xl" />
              </div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation with {otherUser?.name}!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              // Handle both ObjectId and string types for proper comparison
              const messageFromId = typeof message.from === 'object' ? message.from._id || message.from : message.from;
              const currentUserId = user._id;
              const isFromCurrentUser = messageFromId?.toString() === currentUserId?.toString();
              
              return (
                <div
                  key={message._id || index}
                  className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div
                    className={`relative max-w-[70%] px-4 py-2 rounded-2xl ${
                      isFromCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-md ml-12'
                        : 'bg-white text-gray-800 rounded-bl-md mr-12 border border-gray-200'
                    }`}
                    style={{
                      wordWrap: 'break-word',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <p className="text-sm leading-relaxed break-words">{message.message}</p>
                    <div className={`flex items-center justify-end mt-1 ${
                      isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {formatTime(message.createdAt)}
                      </span>
                      {isFromCurrentUser && (
                        <span className="ml-1 text-xs">
                          {message.status === 'sending' ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : message.status === 'sent' ? (
                            '✓'
                          ) : message.status === 'delivered' ? (
                            '✓✓'
                          ) : message.status === 'read' ? (
                            <span className="text-blue-300">✓✓</span>
                          ) : (
                            '✓'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex justify-start mb-2">
              <div className="bg-white text-gray-800 rounded-bl-md mr-12 border border-gray-200 px-4 py-2">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal; 
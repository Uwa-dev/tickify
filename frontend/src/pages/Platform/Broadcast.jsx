// src/components/Broadcast.jsx

import React, { useState, useEffect } from 'react';
import { Mail, Bell, MessageSquare, Gift, User, Users, Megaphone, Loader2 } from 'lucide-react';
import { createBroadcast, getAdminBroadcasts } from '../../services/broadcastApi';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './broadcast.css';

// The Broadcast component contains all the page's logic and UI
const Broadcast = () => {
  const userId = useSelector((state) => state.user.user?._id);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    recipient: 'all',
    messageType: 'announcement',
  });
  // State to hold the list of broadcasts fetched from the API
  const [broadcasts, setBroadcasts] = useState([]);

  // UI states for handling API call status
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  
  // The mock data from the original component has been removed as it's no longer needed.

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/');
    } else {
        const fetchBroadcasts = async () => {
            try {
              setIsLoading(true);
              setError(null);
              // Use the actual getAdminBroadcasts function
              const fetchedBroadcasts = await getAdminBroadcasts();
              setBroadcasts(fetchedBroadcasts);
            } catch (err) {
              console.error('Error fetching broadcasts:', err);
              setError('Failed to fetch broadcasts. Please try again.');
            } finally {
              setIsLoading(false);
            }
          };
          fetchBroadcasts();
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    setError(null);
    
    // Get the sender ID directly from the Redux state, as you requested
    const senderId = userId;
    if (!senderId) {
      setError('Cannot send broadcast: No user is currently authenticated.');
      setIsSending(false);
      return;
    }

    try {
      const broadcastPayload = {
        ...formData,
        sender: senderId // Use the ID from the Redux state
      };

      // Use the actual createBroadcast function
      const newBroadcast = await createBroadcast(broadcastPayload);
      setBroadcasts(prevBroadcasts => [newBroadcast, ...prevBroadcasts]);
      
      setFormData({
        title: '',
        content: '',
        recipient: 'all',
        messageType: 'announcement',
      });
      setMessage('Broadcast message sent successfully!');
    } catch (err) {
      console.error('Error creating broadcast:', err);
      const serverMessage = err.response?.data?.message || 'Failed to send broadcast.';
      setError(serverMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container"> 

      {/* Broadcast Form Section */}
      <div className="grid-container">
        <div className="card">
          <h2>
            <Megaphone />
            Compose New Broadcast
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Happy New Year 2025!"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Message Content</label>
              <textarea
                id="content"
                name="content"
                rows="6"
                value={formData.content}
                onChange={handleChange}
                placeholder="Type your message here..."
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="recipient">Recipients</label>
                <div className="select-container">
                  <select
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                  >
                    <option value="all">All Users</option>
                    <option value="organizers">Event Organizers</option>
                    <option value="birthday">Users with upcoming birthdays</option>
                    <option value="single">Single User (by ID/Email)</option>
                  </select>
                  <Users />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="messageType">Message Type</label>
                <div className="select-container">
                  <select
                    id="messageType"
                    name="messageType"
                    value={formData.messageType}
                    onChange={handleChange}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="greeting">Greeting</option>
                    <option value="eventSuccess">Event Success</option>
                    <option value="personalized">Personalized</option>
                  </select>
                  <Bell />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="button"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Mail />
                  Send Broadcast
                </>
              )}
            </button>
          </form>
          {!userId && (<div className="error-message">You must be logged in to send a broadcast.</div>)}
          {message && (
            <div className="success-message">
              {message}
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Recent Broadcasts Section */}
        <div className="card">
          <h2>
            <MessageSquare />
            Recent Broadcasts
          </h2>
          {isLoading ? (
            <div className="loader-container">
              <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
            </div>
          ) : (
            <ul className="broadcast-list">
              {broadcasts.length > 0 ? (
                broadcasts.map(broadcast => (
                  <li key={broadcast._id} className="broadcast-item">
                    <div className="broadcast-item-header">
                      <h3>{broadcast.title}</h3>
                      <span>{new Date(broadcast.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="broadcast-content">
                      {broadcast.content}
                    </p>
                    <div className="broadcast-meta">
                      <span>
                        <User />
                        {broadcast.recipient === 'all' && 'All Users'}
                        {broadcast.recipient === 'organizers' && 'Event Organizers'}
                        {broadcast.recipient === 'user' && 'Regular Users'}
                      </span>
                      <span>
                        <Gift />
                        {broadcast.messageType}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No broadcasts found.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Broadcast;

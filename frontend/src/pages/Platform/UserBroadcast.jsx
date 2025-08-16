import React, { useState, useEffect } from 'react';
import { MessageSquare, Gift, User, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserBroadcasts } from '../../services/broadcastApi';
import './broadcast.css';

// This component fetches and displays a list of broadcasts for the user.
const UserBroadcast = () => {
  // Retrieve authentication status from Redux state.
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const navigate = useNavigate();

  // State to hold the list of broadcasts, loading status, and any errors.
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state to manage the IDs of broadcasts that have been "read".
  // This will be used to conditionally show or hide the unread indicator.
  const [readBroadcastIds, setReadBroadcastIds] = useState([]);

  // The useEffect hook runs once on component mount to fetch data.
  useEffect(() => {
    // Redirect to the login page if the user is not authenticated.
    if (!isAuthenticated) {
      navigate('/');
    } else {
      const fetchBroadcasts = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const fetchedBroadcasts = await getUserBroadcasts();
          setBroadcasts(fetchedBroadcasts);

          // Once broadcasts are fetched, mark all of them as read.
          // In a real app, this would be an API call to the backend.
          const idsToMarkAsRead = fetchedBroadcasts.map(b => b._id);
          setReadBroadcastIds(idsToMarkAsRead);

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

  return (
    <div className="container">
      {/* Recent Broadcasts Section */}
      <div className="card">
        <h2>
          <MessageSquare />
          Recent Broadcasts
        </h2>
        {isLoading ? (
          // Display a loading spinner while data is being fetched.
          <div className="loader-container">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        ) : (
          <ul className="broadcast-list">
            {broadcasts.length > 0 ? (
              // Map over the fetched broadcasts to render each item.
              broadcasts.map(broadcast => (
                <li key={broadcast._id} className="broadcast-item">
                  <div className="broadcast-item-header">
                    <h3>{broadcast.title}</h3>
                    {/* Conditionally render the "new" span if the broadcast ID is not in our read list */}
                    {!readBroadcastIds.includes(broadcast._id) && (
                      <span className="unread-indicator">New!</span>
                    )}
                    <span>{new Date(broadcast.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="broadcast-content">
                    {broadcast.content}
                  </p>
                  <div className="broadcast-meta">
                    <span>
                      <User />
                      {/* Display a descriptive recipient name */}
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
              // Display a message if no broadcasts are found.
              <p className="text-gray-500">No broadcasts found.</p>
            )}
          </ul>
        )}
        {/* Display an error message if the API call fails */}
        {error && (
            <div className="error-message">
              {error}
            </div>
          )}
      </div>
    </div>
  );
};

export default UserBroadcast;

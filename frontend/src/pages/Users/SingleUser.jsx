import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Circle, CircleOff, MapPin, DollarSign, BarChart2 } from 'lucide-react';
import './user.css';
// Assuming you've added a new function to your adminApi service file
import { getUserData, getOrganizerMetrics } from '../../services/adminApi';

const SingleUser = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null); // New state for metrics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's general profile data
        const data = await getUserData(id);
        setUserData(data);

        // --- NEW: Fetch the business metrics using the new API service ---
        const metricsData = await getOrganizerMetrics(id);
        setUserMetrics(metricsData);

      } catch (err) {
        setError(err.message);
        console.error("Error fetching user or metrics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-text">Error: {error}</div>
        <Link to="/admin/users" className="back-link">
          <ArrowLeft className="back-arrow" /> Back to All Users
        </Link>
      </div>
    );
  }

  // Ensure both userData and userMetrics are available before rendering
  if (!userData || !userMetrics) {
    return (
      <div className="error-container">
        <div className="error-text">No user data or metrics found.</div>
        <Link to="/admin/users" className="back-link">
          <ArrowLeft className="back-arrow" /> Back to All Users
        </Link>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="allevents-container">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">
            <User className="icon" />
            {userData.username}'s Profile
          </h1>
          <Link to="/admin/users" className="back-link">
            <ArrowLeft className="back-arrow" />
            Back to Users
          </Link>
        </div>

        <div className="profile-content">
          <div>
            <h2 className="section-title">
              <User className="icon" /> Account Details
            </h2>
            <div className="details-list">
              <div className="detail-item">
                <Mail className="icon" />
                <span className="detail-label">Email:</span>
                <span className="detail-value">{userData.email}</span>
              </div>
              <div className="detail-item">
                <MapPin className="icon" />
                <span className="detail-label">Location:</span>
                <span className="detail-value">{userData.location || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <Calendar className="icon" />
                <span className="detail-label">Account Created:</span>
                {/* --- FIX: Using the correct 'createdAt' field from the database schema --- */}
                <span className="detail-value">
                  {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className={`detail-item ${userData.isBanned ? 'status-banned' : 'status-active'}`}>
                {userData.isBanned ? (
                  <CircleOff className="icon" />
                ) : (
                  <Circle className="icon" />
                )}
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {userData.isBanned ? 'Banned' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="section-title">
              <BarChart2 className="icon" /> Business Metrics
            </h2>
            <div className="details-list">
              <div className="detail-item">
                <Calendar className="icon" />
                <span className="detail-label">Total Events:</span>
                {/* --- UPDATE: Use userMetrics.totalEvents --- */}
                <span className="detail-value">{userMetrics.totalEvents || 0}</span>
              </div>
              <div className="detail-item">
                <DollarSign className="icon" />
                <span className="detail-label">Total Sales:</span>
                {/* --- UPDATE: Use userMetrics.totalSales --- */}
                <span className="detail-value">{formatCurrency(userMetrics.totalSales)}</span>
              </div>
              <div className="detail-item">
                <DollarSign className="icon" />
                <span className="detail-label">Total Revenue:</span>
                {/* --- UPDATE: Use userMetrics.totalRevenue --- */}
                <span className="detail-value">{formatCurrency(userMetrics.totalRevenue)}</span>
              </div>
              <div className="detail-item">
                <Calendar className="icon" />
                <span className="detail-label">Latest Event Name:</span> {/* Corrected label */}
                <span className="detail-value">
                  {/* Corrected property to use latestEventName */}
                  {userMetrics.latestEventName || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleUser;

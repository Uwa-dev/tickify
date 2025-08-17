import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Ticket,
  User,
  DollarSign,
  Info,
  Circle,
  CircleOff,
  Clock,
  Wallet,
} from 'lucide-react';
import { getEventById } from '../../services/eventApi';
import { getPlatformFee } from '../../services/adminApi';
import { getEventSalesSummary } from '../../services/ticketApi'; // Renamed to reflect backend function

const SingleEvents = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define colors as constants
  const colors = {
    primary: '#6366f1',
    secondary: '#f3f4f6',
    text: '#1f2937',
    subText: '#4b5563',
    borderColor: '#e5e7eb',
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    backgroundStart: '#f8f8f8',
    backgroundEnd: '#f0f0f0',
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setLoading(false);
        setError("Event ID not provided in URL.");
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all necessary data
        const [eventDetails, salesSummaryData, platformFeeData] = await Promise.all([
          getEventById(eventId),
          getEventSalesSummary(eventId), // Use the getSalesSummary function
          getPlatformFee(),
        ]);
        
        const combinedData = {
          ...eventDetails,
          ...salesSummaryData.event,
          totals: {
            sales: salesSummaryData.totals?.sales || 0,
            totalSalesGross: salesSummaryData.totals?.totalSalesGross || 0,
            platformRevenue: salesSummaryData.totals?.platformRevenue || 0,
          },
          platformFeePercentage: platformFeeData.feePercentage || 0,
          organizerName: eventDetails.organizer?.username || 'Unknown Organizer',
        };
        
        setEventData(combinedData);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Fetching event details...</div>
      </div>
    );
  }

  if (error || !eventData || !eventData.totals) {
    return (
      <div className="error-container">
        <div className="error-text">Error: {error || 'Event or sales data not found'}</div>
        <Link to="/admin/events" className="error-link">
          <ArrowLeft size={16} /> Back to All Events
        </Link>
      </div>
    );
  }
  
  return (
    <>
      <style jsx="true">{`
        :root {
          --primary-color: ${colors.primary};
          --secondary-color: ${colors.secondary};
          --text-color: ${colors.text};
          --sub-text-color: ${colors.subText};
          --border-color: ${colors.borderColor};
          --success-color: ${colors.success};
          --error-color: ${colors.error};
          --info-color: ${colors.info};
          --background-start: #f8f8f8;
          --background-end: #f0f0f0;
          --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --card-shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .event-page-container {
          min-height: 100vh;
          background-color: var(--background-start);
          background-image: linear-gradient(135deg, var(--background-start) 0%, var(--backgroundEnd) 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: var(--text-color);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .event-details-card {
          max-width: 1000px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .event-details-card:hover {
            box-shadow: var(--card-shadow-hover);
        }

        .banner-image {
          width: 100%;
          height: 250px;
          object-fit: cover;
          display: block;
        }

        .header-section {
          padding: 2rem;
          background-color: #fcfcfc;
          border-bottom: 1px solid var(--border-color);
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--sub-text-color);
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary-color);
        }

        .event-title {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0;
        }

        .event-description {
          font-size: 1rem;
          color: var(--sub-text-color);
          line-height: 1.6;
          margin-top: 0.75rem;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 2rem;
          padding: 2rem;
        }
        
        @media (min-width: 768px) {
          .content-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .section-title svg {
          color: var(--primary-color);
        }
        
        .section-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-card {
          background-color: var(--secondary-color);
          padding: 1.25rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid var(--border-color);
          transition: background-color 0.2s, transform 0.2s;
        }
        
        .info-card:hover {
            background-color: #e5e7eb;
            transform: translateY(-2px);
        }

        .info-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background-color: #eef2ff;
          border-radius: 50%;
        }

        .info-text {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--sub-text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .info-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .status-card {
          background-color: #f7f3ff;
        }

        .status-card.active {
          background-color: #d1fae5;
          border-color: var(--success-color);
        }
        
        .status-card.inactive {
          background-color: #fee2e2;
          border-color: var(--error-color);
        }
        
        .status-card .info-value.active {
            color: var(--success-color);
            font-weight: 700;
        }
        
        .status-card .info-value.inactive {
            color: var(--error-color);
            font-weight: 700;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(to bottom right, #f0f4f8, #e2e8f0);
          text-align: center;
          padding: 2rem;
        }

        .loading-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--sub-text-color);
          margin-top: 1rem;
        }

        .spinner {
          border: 6px solid #e0e7ff;
          border-top: 6px solid var(--primary-color);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--error-color);
          margin-bottom: 1.5rem;
        }
        
        .error-link {
          color: var(--info-color);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .error-link:hover {
          color: var(--primary-color);
        }
      `}</style>
      <div className="event-page-container">
        <div className="event-details-card">
          <img src={eventData.eventImage} alt={`${eventData.eventName} banner`} className="banner-image" />
          <div className="header-section">
            <div className="header-top">
              <h1 className="event-title">{eventData.eventName}</h1>
              <Link to="/admin/events" className="back-link">
                <ArrowLeft size={16} />
                Back to Events
              </Link>
            </div>
            <p className="event-description">{eventData.description}</p>
          </div>

          <div className="content-grid">
            {/* General Details Section */}
            <div>
              <h2 className="section-title">
                <Info size={20} />
                General Details
              </h2>
              <div className="section-cards">
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <User size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Organizer</div>
                    <div className="info-value">{eventData.organizerName}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <Calendar size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Start Date</div>
                    <div className="info-value">{new Date(eventData.startDate).toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <Clock size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Start Time</div>
                    <div className="info-value">{new Date(eventData.startDate).toLocaleTimeString('en-US', { timeStyle: 'short' })}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <MapPin size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Location</div>
                    <div className="info-value">{eventData.location}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket & Sales Section */}
            <div>
              <h2 className="section-title">
                <Ticket size={20} />
                Ticket & Sales
              </h2>
              <div className="section-cards">
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <DollarSign size={20} color={colors.info} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Total Gross Sales</div>
                    <div className="info-value">{formatCurrency(eventData.totals.totalSalesGross)}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <DollarSign size={20} color={colors.success} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Platform Revenue</div>
                    <div className="info-value">{formatCurrency(eventData.totals.platformRevenue)}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <Ticket size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Tickets Sold</div>
                    <div className="info-value">{eventData.totals.sales}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <h2 className="section-title">
                <Info size={20} />
                Event Status
              </h2>
              <div className="section-cards">
                <div className={`info-card status-card ${eventData.isPublished ? 'active' : 'inactive'}`}>
                  <div className="info-icon-wrapper">
                    {eventData.isPublished ? (
                      <Circle size={20} color={colors.success} />
                    ) : (
                      <CircleOff size={20} color={colors.error} />
                    )}
                  </div>
                  <div className="info-text">
                    <div className="info-label">Published Status</div>
                    <div className={`info-value ${eventData.isPublished ? 'active' : 'inactive'}`}>
                      {eventData.isPublished ? 'Published' : 'Unpublished'}
                    </div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <Calendar size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Created On</div>
                    <div className="info-value">{new Date(eventData.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon-wrapper">
                    <Tag size={20} color={colors.primary} />
                  </div>
                  <div className="info-text">
                    <div className="info-label">Category</div>
                    <div className="info-value">{eventData.eventCategory}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SingleEvents;

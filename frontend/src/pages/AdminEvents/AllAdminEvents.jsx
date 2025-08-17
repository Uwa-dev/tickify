import React, { useState, useEffect } from 'react';
import { getAllEvents } from '../../services/adminApi';
import { toggleEventPublish } from '../../services/eventApi';
import { getPlatformFee } from '../../services/adminApi';
import { getEventSalesSummary } from '../../services/ticketApi';
import { Link } from 'react-router-dom';
import './allevents.css';
import { Touchpad, TouchpadOff } from 'lucide-react';
import { toast } from 'react-toastify';

// A simple confirmation modal component to replace window.confirm
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-btn cancel-btn">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="modal-btn confirm-btn">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const AllAdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      eventId: null,
      eventName: '',
      isPublished: false,
  });

  const formatCurrency = (amount) => {
    // A robust check to ensure the amount is a valid number before formatting
    if (typeof amount !== 'number' || isNaN(amount) || amount === null) {
      return '0.00';
    }
    return amount.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // 1. Fetch all events
      const eventsResponse = await getAllEvents({ page: pagination.page });

      if (eventsResponse.success) {
        // 2. For each event, fetch its sales summary
        const eventsWithSalesPromises = eventsResponse.data.map(async (event) => {
            try {
                // Call the API to get the sales data for this specific event
                const salesSummaryResponse = await getEventSalesSummary(event._id);
                
                return {
                    ...event,
                    // Use the data from the sales summary API response directly
                    ticketsSold: salesSummaryResponse?.totals?.sales || 0,
                    totalSalesGross: salesSummaryResponse?.totals?.totalSalesGross || 0,
                    platformRevenue: salesSummaryResponse?.totals?.platformRevenue || 0,
                };
            } catch (salesError) {
                console.error(`Failed to fetch sales for event ${event._id}:`, salesError);
                return {
                    ...event,
                    ticketsSold: 0,
                    totalSalesGross: 0,
                    platformRevenue: 0,
                };
            }
        });

        // 3. Wait for all sales summary fetches to complete
        const processedEvents = await Promise.all(eventsWithSalesPromises);
        
        // 4. Update state with the processed events
        setEvents(processedEvents);
        setPagination({
          ...pagination,
          totalPages: eventsResponse.pagination.pages
        });
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error(error.message || "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [pagination.page]);

  const handleTogglePublish = (eventId, currentIsPublished, eventName) => {
      setConfirmModal({
          isOpen: true,
          eventId,
          eventName,
          isPublished: currentIsPublished,
      });
  };

  const handleConfirmToggle = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      const response = await toggleEventPublish(confirmModal.eventId);
      toast.success(response.message);

      // Re-fetch to get the updated status and data
      fetchEvents(); 
    } catch (error) {
      toast.error(error.message || "Failed to toggle publish status.");
      console.error("Error toggling publish status:", error);
    }
  };

  if (loading) {
    return (
      <div className='events-container'>
        <div className="card">
          <div className="card-body">
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='events-container'>
        <div className="card">
          <div className="card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Username</th>
                    <th>Event Status</th>
                    <th>Tickets Sold</th>
                    <th>Gross Sales</th>
                    <th>Revenue</th>
                    <th>Publish/Unpublish</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>No events found.</td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event._id}>
                        <td>
                          <Link
                            to={`/admin/events/${event._id}`}
                            className="event-link"
                          >
                            {event.eventId}
                          </Link>
                        </td>
                        <td>{event.username}</td>
                        <td>
                          <span className={`status ${
                            event.status === 'inactive' || event.status === 'ended' ? 'processing' : 'delivered'
                          }`}>
                            {
                              event.status === 'ended' ? 'Ended' :
                              !event.isPublished ? 'Unpublished' :
                              'Published'
                            }
                          </span>
                        </td>
                        <td>{event.ticketsSold}</td>
                        <td>₦{formatCurrency(event.totalSalesGross)}</td>
                        <td>₦{formatCurrency(event.platformRevenue)}</td>
                        <td
                          className={event.status === 'ended' ? 'disabled-icon' : ''}
                          onClick={event.status === 'ended' ? null : () => handleTogglePublish(event._id, event.isPublished, event.eventName)}
                        >
                          {event.isPublished ? (
                            <Touchpad className="clickable-icon" title="Click to Unpublish" />
                          ) : (
                            <TouchpadOff className="clickable-icon" title="Click to Publish" />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                  disabled={pagination.page === 1}
                  className='pagination-btn'
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                  disabled={pagination.page >= pagination.totalPages}
                  className='pagination-btn'
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
          isOpen={confirmModal.isOpen}
          message={
              confirmModal.isPublished
                ? `Are you sure you want to UNPUBLISH "${confirmModal.eventName}"? This will make the event inactive and stop ticket sales.`
                : `Are you sure you want to PUBLISH "${confirmModal.eventName}"? This will make the event active and allow ticket sales.`
          }
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
};

export default AllAdminEvents;

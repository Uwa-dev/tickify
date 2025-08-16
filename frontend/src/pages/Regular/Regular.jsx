import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRegularGuests } from '../../services/ticketApi'; // NEW: Import the API service
import '../Events/viewEvents.css'; // Assuming common event styles
import '../Events/event.css'; // Assuming common event styles

const Regular = () => {
  const [regularGuests, setRegularGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const response = await getRegularGuests();
        setRegularGuests(response.data); // Assuming response.data is the array of guests
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load regular guests.");
        console.error("Error fetching regular guests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  if (loading) {
    return (
      <div className="allevents-container">
        <div className="loading-container">Loading regular guests...</div>
      </div>
    );
  }

  return (
    <div className='allevents-container'>

      <div className='heading-container'>
        <h3 className="form-title">Regular Guests</h3>
      </div>

      <div className="add-ticket-container" style={{ marginTop: '20px' }}> {/* Reusing container for table styling */}
        <h4 className="form-subtitle">Guests by Events Attended</h4>
        {regularGuests.length > 0 ? (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Events Attended</th>
                </tr>
              </thead>
              <tbody>
                {regularGuests.map((guest, index) => (
                  <tr key={index}>
                    <td>{guest.fullName || 'N/A'}</td>
                    <td>{guest.email || 'N/A'}</td>
                    <td>{guest.phoneNumber || 'N/A'}</td>
                    <td>{guest.eventsAttendedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-tickets-message">No regular guests found yet.</p>
        )}
      </div>
    </div>
  );
};

export default Regular;
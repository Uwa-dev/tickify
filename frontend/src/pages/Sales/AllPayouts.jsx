import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { getAllPayoutsAdmin } from '../../services/payoutApi';
import './sales.css';

const AllPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch all payouts for the admin
  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await getAllPayoutsAdmin();
      if (response.status) {
        setPayouts(response.data);
      } else {
        toast.error(response.message || "Failed to fetch payouts.");
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error(error.message || "Failed to fetch payouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Show a loading indicator while data is being fetched
  if (loading) {
    return <div className="payouts-container">Loading all payouts...</div>;
  }

  return (
    <div className='payouts-container'>
      <h2 className="payouts-header">All Payout Requests</h2>

      {payouts.length === 0 ? (
        <p className="no-payouts-message">No payout requests have been made yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="payouts-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payout ID</th>
                <th>Event Name</th>
                <th>Organizer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(payout => (
                <tr key={payout._id}>
                  <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                  <td>
                    {/* The payout ID is now a link to the details page */}
                    <Link to={`/admin/payouts/${payout._id}`} className="text-blue-600 underline hover:text-blue-800">
                      {payout._id.slice(-10)}
                    </Link>
                  </td>
                  <td>{payout.event?.eventName || 'N/A'}</td>
                  <td>{payout.organizer?.username || 'N/A'}</td>
                  <td>₦{payout.amount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`status-badge ${payout.status?.toLowerCase()}`}>
                      {payout.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllPayouts;

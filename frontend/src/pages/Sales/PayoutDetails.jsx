import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux'; // Import useSelector
// Import the new specific API functions
import { getSinglePayoutAdmin, completePayoutAdmin, cancelPayoutOrganizer } from "../../services/payoutApi";
import { useParams } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';

const PayoutDetails = () => {
  const { payoutId } = useParams();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get currentUser from Redux store
  // Assuming your user state is under 'user.user' in the Redux store
  const currentUser = useSelector((state) => state.user.user);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  useEffect(() => {
    const fetchPayout = async () => {
      // Fetch payout only if payoutId exists and user authentication state is known
      // (e.g., isAuthenticated is true or false, not undefined)
      // We also check if currentUser is not null, as the payout details might depend on user role.
      if (payoutId && (isAuthenticated !== undefined) && currentUser) {
        try {
          setLoading(true);
          const data = await getSinglePayoutAdmin(payoutId);
          setPayout(data.data);
          console.log("Fetched Payout Data:", data.data);
        } catch (err) {
          setError(err.message);
          toast.error(err.message);
          console.error("Error fetching payout:", err);
        } finally {
          setLoading(false);
        }
      } else if (!currentUser) {
        // If no current user, we might still want to load payout details but restrict actions
        // Or show a message indicating login is required for full functionality.
        console.warn("No current user detected. Payout actions will be restricted.");
        // You might want to fetch payout details even without a user if they are public
        // but for actions, currentUser is essential.
        if (payoutId) {
            try {
                setLoading(true);
                const data = await getSinglePayoutAdmin(payoutId); // Still try to fetch for viewing
                setPayout(data.data);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
      }
    };

    fetchPayout();
  }, [payoutId, isAuthenticated, currentUser]); // Add currentUser to dependency array

  // Function to handle marking payout as completed (Admin action)
  const handleCompletePayout = async () => {
    if (!payout || payout.status.toLowerCase() !== 'pending') { // Fixed: added .toLowerCase()
      toast.warn('Only pending payouts can be marked as completed.');
      return;
    }
    // IMPORTANT: Replace window.confirm with a custom modal for better UX
    if (!window.confirm('Are you sure you want to mark this payout as completed?')) {
      return; // User cancelled
    }
    try {
      setLoading(true);
      const updatedData = await completePayoutAdmin(payoutId, { status: 'completed' });
      setPayout(updatedData.data);
      toast.success('Payout marked as completed successfully! 🎉');
    } catch (err) {
      const errorMessage = err.message || 'Failed to mark payout as completed.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle cancelling payout (Organizer action)
  const handleCancelPayout = async () => {
    if (!payout || payout.status.toLowerCase() !== 'pending') { // Fixed: added .toLowerCase()
      toast.warn('Only pending payouts can be cancelled.');
      return;
    }
    // IMPORTANT: Replace window.confirm with a custom modal for better UX
    if (!window.confirm('Are you sure you want to cancel this payout?')) {
      return; // User cancelled
    }
    try {
      setLoading(true);
      const updatedData = await cancelPayoutOrganizer(payoutId);
      setPayout(updatedData.data);
      toast.success('Payout cancelled successfully! ❌');
    } catch (err) {
      const errorMessage = err.message || 'Failed to cancel payout.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Display loading state for payout data
  if (loading) {
    return (
      <div className="container">
        <p className="message">Loading payout details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
        <ToastContainer />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="container">
        <p className="message">No payout found with that ID.</p>
      </div>
    );
  }

  const { _id, event, organizer, amount, status, createdAt } = payout;
  const organizerAccount = organizer?.accountDetails || {};

  // Determine if the current user is the organizer of this payout
  // Use optional chaining (?.) for currentUser as it might be null if no user is logged in
  const isCurrentUserOrganizer = currentUser && currentUser._id === organizer?._id;

  // --- START DEBUGGING LOGS ---
  console.group("PayoutDetails Component Debugging");
  console.log("1. Current Payout Status:", status);
  console.log("2. Current User (from Redux):", currentUser);
  console.log("3. Is Authenticated (from Redux):", isAuthenticated);
  console.log("4. Current User isAdmin (from Redux):", currentUser?.isAdmin);
  console.log("5. Current User ID (from Redux):", currentUser?._id);
  console.log("6. Payout Organizer ID:", organizer?._id);
  console.log("7. Is Current User Organizer (currentUser._id === organizer._id):", isCurrentUserOrganizer);
  // Updated conditions for logging to reflect the fix
  console.log("8. Admin button condition (currentUser?.isAdmin && status.toLowerCase() === 'pending'):", currentUser?.isAdmin && status.toLowerCase() === 'pending');
  console.log("9. Organizer button condition (isCurrentUserOrganizer && status.toLowerCase() === 'pending'):", isCurrentUserOrganizer && status.toLowerCase() === 'pending');
  console.groupEnd();
  // --- END DEBUGGING LOGS ---


  return (
    <div className="container">
      <div className="card">
        <h1 className="header">Payout Details</h1>

        <div className="details-grid">
          <div className="details-item">
            <strong>Payout ID:</strong>
            <span className="mono-text">{_id}</span>
          </div>
          <div className="details-item">
            <strong>Event Name:</strong>
            <span className="event-name">{event?.eventName || 'N/A'}</span>
          </div>
          <div className="details-item">
            <strong>Amount:</strong>
            <span className="amount">₦{amount?.toFixed(2)}</span>
          </div>
          <div className="details-item">
            <strong>Date:</strong>
            <span className="date-text">{new Date(createdAt).toLocaleDateString()}</span>
          </div>
          <div className="details-item">
            <strong>Status:</strong>
            <span className={`status-badge ${status.toLowerCase()}`}> {/* Changed for CSS class */}
              {status}
            </span>
          </div>
        </div>

        <div className="account-details-section">
          <h2 className="subheader">Organizer Details</h2>
          <div className="account-item">
            <strong>First Name:</strong>
            <span className="account-text">{organizer?.firstName || 'N/A'}</span>
          </div>
          {organizer?.middleName && (
            <div className="account-item">
              <strong>Middle Name:</strong>
              <span className="account-text">{organizer?.middleName}</span>
            </div>
          )}
          <div className="account-item">
            <strong>Last Name:</strong>
            <span className="account-text">{organizer?.lastName || 'N/A'}</span>
          </div>
          <div className="account-item">
            <strong>Organizer Username:</strong>
            <span className="account-text">{organizer?.username || 'N/A'}</span>
          </div>
          <h2 className="subheader" style={{ marginTop: '20px' }}>Bank Account Details</h2>
          <div className="account-item">
            <strong>Account Name:</strong>
            <span className="account-text">{organizerAccount.accountName || 'N/A'}</span>
          </div>
          <div className="account-item">
            <strong>Bank Name:</strong>
            <span className="account-text">{organizerAccount.bankName || 'N/A'}</span>
          </div>
          <div className="account-item">
            <strong>Account Number:</strong>
            <span className="account-text">{organizerAccount.accountNumber || 'N/A'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {/* Admin button to complete payout */}
          {currentUser?.isAdmin && status.toLowerCase() === 'pending' && (
            <button
              onClick={handleCompletePayout}
              className="action-button complete-button"
            >
              Mark as Completed
            </button>
          )}

          {/* Organizer button to cancel payout */}
          {isCurrentUserOrganizer && status.toLowerCase() === 'pending' && (
            <button
              onClick={handleCancelPayout}
              className="action-button cancel-button"
            >
              Cancel Payout
            </button>
          )}
        </div>

      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />

      <style>{`
        .container {
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: sans-serif;
        }

        .card {
          max-width: 900px;
          width: 100%;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 32px;
        }

        .header {
          font-size: 2.25rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 16px;
        }

        .subheader {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        .details-item,
        .account-item {
          display: flex;
          flex-direction: column;
          font-size: 1.125rem;
          color: #4b5563;
        }
        .details-item strong,
        .account-item strong {
            color: #1f2937;
            margin-bottom: 4px;
        }

        .details-item span {
            font-weight: 500;
        }

        .mono-text {
          font-family: monospace;
          color: #6b7280;
        }

        .event-name {
            color: #2563eb;
            font-weight: 600;
        }

        .username {
            color: #4b5563;
            font-weight: 500;
        }

        .amount {
            color: #10b981;
            font-weight: bold;
        }

        .date-text {
            color: #6b7280;
            font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: bold;
          text-transform: capitalize;
          margin-top: 4px;
        }

        .status-badge.pending {
          background-color: #fde68a;
          color: #92400e;
        }

        .status-badge.successful { /* Renamed from 'successful' to 'completed' for consistency */
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-badge.completed { /* Added for the new 'completed' status */
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-badge.cancelled { /* Added for the new 'cancelled' status */
          background-color: #fee2e2;
          color: #991b1b;
        }


        .account-details-section {
          margin-top: 32px;
          border-top: 2px solid #e5e7eb;
          padding-top: 24px;
        }

        .account-details-section .account-item {
          margin-bottom: 12px;
        }

        .account-text {
            font-weight: 500;
            color: #4b5563;
        }

        .message {
            font-size: 1.25rem;
            color: #4b5563;
        }

        .error-message {
            font-size: 1.25rem;
            color: #ef4444;
        }

        .action-buttons {
          margin-top: 32px;
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .action-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .complete-button {
          background-color: #10b981; /* Green */
          color: white;
        }

        .complete-button:hover {
          background-color: #059669;
        }

        .cancel-button {
          background-color: #ef4444; /* Red */
          color: white;
        }

        .cancel-button:hover {
          background-color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default PayoutDetails;

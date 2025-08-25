import React, { useState, useEffect } from 'react';
import Details from '../../../components/reuse/Details/Details';
import { ArrowLeft, BanknoteArrowDown, X } from 'lucide-react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { getPayoutsForEvent, getPayoutSummaryForEvent, requestPayout } from '../../../services/payoutApi';
import "./summary.css";
import Load from '../../../components/reuse/Load';

const PayoutSummary = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    totalPlatformFees: 0,
    organizerRevenue: 0,
    totalPaidOut: 0,
    remainingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutRequestForm, setPayoutRequestForm] = useState({
    amount: '',
    payoutMethod: 'Bank Transfer',
    notes: ''
  });

  const fetchPayoutData = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot fetch payout data.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log("Fetching payout summary for event:", eventId);
      
      const summaryResponse = await getPayoutSummaryForEvent(eventId);
      console.log("Payout Summary Response:", summaryResponse);
      
      // Map the response data to match our expected structure
      const safeData = {
        totalRevenue: Number(summaryResponse.data.totalRevenue) || 0,
        totalPlatformFees: Number(summaryResponse.data.totalPlatformFees) || 0,
        organizerRevenue: Number(summaryResponse.data.organizerRevenue) || 0,
        totalPaidOut: Number(summaryResponse.data.totalPaidOut) || 0,
        remainingBalance: Number(summaryResponse.data.remainingBalance) || 0,
        event: summaryResponse.data.event
      };
      
      console.log("Processed payout data:", safeData);
      setSummaryData(safeData);
      setEvent(safeData.event);

      const payoutsResponse = await getPayoutsForEvent(eventId);
      console.log("Payouts response:", payoutsResponse);
      setPayouts(payoutsResponse.data);

    } catch (error) {
      console.error("Error fetching payout data:", error);
      toast.error(error.response?.data?.message || "Failed to load payout data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, [eventId, navigate]);

  const handlePayoutFormChange = (e) => {
    const { name, value } = e.target;
    setPayoutRequestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!payoutRequestForm.amount || payoutRequestForm.amount <= 0 || !payoutRequestForm.payoutMethod) {
      toast.error("Please provide a valid amount and payout method.");
      return;
    }

    // Prevent requesting more than the remaining balance
    if (parseFloat(payoutRequestForm.amount) > summaryData.remainingBalance) {
      toast.error(`Cannot request more than the remaining balance of ₦${summaryData.remainingBalance.toFixed(2)}`);
      return;
    }

    try {
      const response = await requestPayout(eventId, {
        ...payoutRequestForm,
        amount: parseFloat(payoutRequestForm.amount)
      });
      toast.success(response.message);
      await fetchPayoutData();
      setPayoutRequestForm({ amount: '', payoutMethod: 'Bank Transfer', notes: '' });
      setShowPayoutModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to submit payout request.");
      console.error("Error requesting payout:", error);
    }
  };

  const openPayoutModal = () => {
    setShowPayoutModal(true);
  };

  const closePayoutModal = () => {
    setShowPayoutModal(false);
    setPayoutRequestForm({ amount: '', payoutMethod: 'Bank Transfer', notes: '' });
  };

  if (loading) {
    return <div><Load /></div>;
  }

  if (!event) {
    return <div className="error-container">Event not found</div>;
  }

  return (
    <div className='allevents-container'>
      <div className='back-container' onClick={() => navigate(-1)}>
        <ArrowLeft />
        <h4>Back</h4>
      </div>

      <Details event={event} />

      <div className='heading-container'>
        <h3 className="form-title">Payout Summary for {event.eventName}</h3>
      </div>

      <div className="add-ticket-container" style={{ marginTop: '20px' }}>
        <h4 className="form-subtitle">Financial Overview</h4>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Sales</h3>
            <p>₦{summaryData.totalRevenue.toFixed(2)}</p>
            <small>Total amount collected from ticket sales</small>
          </div>
          <div className="summary-card">
            <h3>Platform Fees</h3>
            <p>₦{summaryData.totalPlatformFees.toFixed(2)}</p>
            <small>Fees retained by the platform</small>
          </div>
          <div className="summary-card highlight">
            <h3>Your Revenue</h3>
            <p>₦{summaryData.organizerRevenue.toFixed(2)}</p>
            <small>Total sales minus platform fees</small>
          </div>
          <div className="summary-card">
            <h3>Total Paid Out</h3>
            <p>₦{summaryData.totalPaidOut.toFixed(2)}</p>
            <small>Amount already paid to you</small>
          </div>
          <div className="summary-card highlight">
            <h3>Available Balance</h3>
            <p>₦{summaryData.remainingBalance.toFixed(2)}</p>
            <small>Your revenue minus previous payouts</small>
          </div>
        </div>
      </div>

      <div className="add-ticket-container" style={{ marginTop: '20px' }}>
        <div className='header-container'>
          <h4 className="form-subtitle">Payout History</h4>
          <button 
            onClick={openPayoutModal} 
            className='request-btn'
            disabled={summaryData.remainingBalance <= 0}
          >
            Request Payout
          </button>
        </div>
        {payouts.length > 0 ? (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payout ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(payout => (
                  <tr key={payout._id}>
                    <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/payouts/${payout._id}`} className="payout-link">
                        {payout._id.slice(-10)}
                      </Link>
                    </td>
                    <td>₦{payout.amount?.toFixed(2) || '0.00'}</td>
                    <td>{payout.payoutMethod || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${payout.status?.toLowerCase()}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td>{payout.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='empty-payout'>
            <BanknoteArrowDown size={80}/>
            <p className="no-tickets-message">No payout requests found for this event yet.</p>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request New Payout</h3>
              <button className="modal-close" onClick={closePayoutModal}>
                <X size={20} />
              </button>
            </div>
            
            <form className="ticket-form" onSubmit={handleRequestPayout}>
              <div className="ticket-group">
                <div className="ticket-form-group">
                  <label className="ticket-label" htmlFor="amount">Amount (₦):</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={payoutRequestForm.amount}
                    onChange={handlePayoutFormChange}
                    placeholder={`Maximum: ₦${summaryData.remainingBalance.toFixed(2)}`}
                    className="ticket-select"
                    required
                    min="0.01"
                    max={summaryData.remainingBalance}
                    step="0.01"
                  />
                  <small className="balance-info">
                    Available balance: ₦{summaryData.remainingBalance.toFixed(2)}
                  </small>
                </div>
                
                <div className="form-group ticket-form-group">
                  <label className="ticket-label" htmlFor="payoutMethod">Payout Method:</label>
                  <select
                    id="payoutMethod"
                    name="payoutMethod"
                    value={payoutRequestForm.payoutMethod}
                    onChange={handlePayoutFormChange}
                    className="ticket-select"
                    required
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div className="form-group ticket-form-group">
                  <label className="ticket-label" htmlFor="notes">Notes (Optional):</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={payoutRequestForm.notes}
                    onChange={handlePayoutFormChange}
                    placeholder="e.g., For marketing expenses"
                    className="ticket-select"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={closePayoutModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Submit Payout Request
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutSummary;
import React, { useState, useEffect } from 'react';
import Details from '../../components/reuse/Details';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { getPayoutsForEvent, getPayoutSummaryForEvent, requestPayout } from '../../services/payoutApi';
import '../Events/viewEvents.css';
import '../Events/event.css';

const PayoutSummary = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [summaryData, setSummaryData] = useState({
        totalRevenue: 0,
        totalPaidOut: 0,
        remainingBalance: 0,
    });
    const [loading, setLoading] = useState(true);
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
        console.log("Fetching payout data for eventId:", eventId);
        try {
            setLoading(true);
            const summaryResponse = await getPayoutSummaryForEvent(eventId);
            console.log("Payout Summary Response:", summaryResponse);
            setSummaryData(summaryResponse.data);
            setEvent(summaryResponse.data.event);

            const payoutsResponse = await getPayoutsForEvent(eventId);
            console.log("Individual Payouts Response:", payoutsResponse);
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

        try {
            const response = await requestPayout(eventId, {
                ...payoutRequestForm,
                amount: parseFloat(payoutRequestForm.amount)
            });
            toast.success(response.message);
            await fetchPayoutData();
            setPayoutRequestForm({ amount: '', payoutMethod: 'Bank Transfer', notes: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Failed to submit payout request.");
            console.error("Error requesting payout:", error);
        }
    };

    if (loading) {
        return <div className="loading-container">Loading payout data...</div>;
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
                <h3 className="form-title">Payout Summary for: {event.eventName}</h3>
            </div>

            <div className="add-ticket-container" style={{ marginTop: '20px' }}>
                <h4 className="form-subtitle">Overview</h4>
                <div className="summary-cards">
                    <div className="summary-card" style={{ backgroundColor: 'var(--background-color)', color: 'white' }}>
                        <h3>Total Event Revenue</h3>
                        <p>₦{summaryData.totalRevenue?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="summary-card" style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}>
                        <h3>Total Paid Out</h3>
                        <p>₦{summaryData.totalPaidOut?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="summary-card" style={{ backgroundColor: 'var(--color)', color: 'white' }}>
                        <h3>Remaining Balance</h3>
                        <p>₦{summaryData.remainingBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>
            </div>

            <div className="add-ticket-container" style={{ marginTop: '20px' }}>
                <h4 className="form-subtitle">Request New Payout</h4>
                <form className="ticket-form" onSubmit={handleRequestPayout}>
                    <div className="ticket-group">
                        <div className="form-group ticket-form-group">
                            <label className="ticket-label" htmlFor="amount">Amount (₦):</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={payoutRequestForm.amount}
                                onChange={handlePayoutFormChange}
                                placeholder="e.g., 10000.00"
                                className="ticket-select"
                                required
                                min="0.01"
                                step="0.01"
                            />
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
                        <div className="ticket-btn-group">
                            <button type="submit" className="submit-button">Submit Payout Request</button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="add-ticket-container" style={{ marginTop: '20px' }}>
                <h4 className="form-subtitle">Payout History</h4>
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
                                            {/* Link to payout details page */}
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
                    <p className="no-tickets-message">No payout requests found for this event yet.</p>
                )}
            </div>
        </div>
    );
};

export default PayoutSummary;

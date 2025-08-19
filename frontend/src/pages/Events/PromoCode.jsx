import React, { useState, useEffect } from 'react';
import Details from '../../components/reuse/Details/Details';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from '../../services/eventApi';
import { 
    getTicketsOfAnEvent,
    createPromoCode,
    getPromoCodesForEvent,
    updatePromoCodeStatus,
    deletePromoCode
} from '../../services/ticketApi';
import { toast } from 'react-toastify';
import './event.css';
import './viewEvents.css';

const PromoCode = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [promoCodeForm, setPromoCodeForm] = useState({
        code: '',
        discountType: 'percentage',
        value: '',
        usageLimit: '',
        expiryDate: '',
        appliesToTickets: [] // Changed back to an array for checkbox selection
    });

    // Function to fetch all necessary data: event details, tickets, and existing promo codes
    const fetchAllData = async () => {
        if (!eventId) {
            toast.error("Event ID is missing. Cannot fetch details for promo codes.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);

            // Fetch event details
            const eventResponse = await getEventById(eventId);
            const fetchedEvent = eventResponse;
            if (fetchedEvent) {
                setEvent(fetchedEvent);
            } else {
                toast.error("Event details not found or invalid response from API.");
                setEvent(null);
            }

            // Fetch tickets for the event
            const ticketsResponse = await getTicketsOfAnEvent(eventId);
            setTickets(ticketsResponse.data.tickets);

            // Fetch existing promo codes for the event
            const promoCodesResponse = await getPromoCodesForEvent(eventId);
            setPromoCodes(promoCodesResponse.data);

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load data for promo codes.");
            console.error("Error fetching data for promo codes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [eventId, navigate]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setPromoCodeForm(prev => ({ ...prev, [name]: value }));
    };

    // NEW: Handle checkbox changes for appliesToTickets
    const handleTicketCheckboxChange = (e) => {
        const { value, checked } = e.target;

        setPromoCodeForm(prev => {
            let newAppliesToTickets;
            if (value === "") { // "All Tickets" checkbox
                newAppliesToTickets = checked ? [] : prev.appliesToTickets; // If checked, clear others; otherwise, keep current
            } else { // Individual ticket checkbox
                if (checked) {
                    newAppliesToTickets = [...prev.appliesToTickets, value];
                } else {
                    newAppliesToTickets = prev.appliesToTickets.filter(id => id !== value);
                }
            }
            return { ...prev, appliesToTickets: newAppliesToTickets };
        });
    };

    const handleCreatePromoCode = async (e) => {
        e.preventDefault();
        // Basic frontend validation
        if (!promoCodeForm.code || promoCodeForm.value === '' || !promoCodeForm.expiryDate) {
            toast.error("Please fill in all required promo code fields.");
            return;
        }
        if (promoCodeForm.discountType === 'percentage' && (promoCodeForm.value < 0 || promoCodeForm.value > 100)) {
            toast.error("Percentage discount must be between 0 and 100.");
            return;
        }
        if (promoCodeForm.discountType === 'fixed' && promoCodeForm.value <= 0) {
            toast.error("Fixed discount must be greater than 0.");
            return;
        }

        try {
            const response = await createPromoCode(eventId, {
                ...promoCodeForm,
                usageLimit: promoCodeForm.usageLimit === '' ? 0 : parseInt(promoCodeForm.usageLimit),
                value: parseFloat(promoCodeForm.value),
                // Ensure appliesToTickets is an array, empty if "All Tickets" was selected implicitly
                appliesToTickets: promoCodeForm.appliesToTickets || []
            });
            toast.success(response.message);
            setPromoCodes(prev => [...prev, response.data]);
            setPromoCodeForm({ code: '', discountType: 'percentage', value: '', usageLimit: '', expiryDate: '', appliesToTickets: [] });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Failed to create promo code.");
            console.error("Error creating promo code:", error);
        }
    };

    const handleDeletePromoCode = async (_id, code) => {
        if (window.confirm(`Are you sure you want to delete promo code "${code}"? This cannot be undone.`)) {
            try {
                const response = await deletePromoCode(_id);
                toast.success(response.message);
                setPromoCodes(prev => prev.filter(pc => pc._id !== _id));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || `Failed to delete "${code}" promo code.`);
                console.error("Error deleting promo code:", error);
            }
        }
    };

    const handleTogglePromoCodeStatus = async (_id, currentStatus, code) => {
        const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
        if (window.confirm(`Are you sure you want to change status of "${code}" to "${newStatus}"?`)) {
            try {
                const response = await updatePromoCodeStatus(_id, newStatus);
                toast.success(response.message);
                setPromoCodes(prev => prev.map(promo =>
                    promo._id === _id ? { ...promo, status: newStatus } : promo
                ));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message || `Failed to change status of "${code}".`);
                console.error("Error toggling promo code status:", error);
            }
        }
    };

    // Helper to get ticket type name from populated ticket object
    const getTicketTypeName = (ticketObj) => {
        return ticketObj?.ticketType || 'Unknown Ticket';
    };


    if (loading) {
        return <div className="loading-container">Loading event details...</div>;
    }

    if (!event) {
        return <div className="error-container">Event details not found.</div>;
    }

  return (
    <div className="allevents-container">

        <div className='back-container' onClick={() => navigate(-1)}>
            <ArrowLeft />
            <h4>Back</h4>
        </div>

        <Details event={event} />

        <div className='heading-container'>
            <h3 className="form-title">Manage Promo Codes for: {event.eventName}</h3>
        </div>

        <div className="add-ticket-container">
            <h4 className="form-subtitle">Create New Promo Code</h4>
            <form className="ticket-form" onSubmit={handleCreatePromoCode}>
                <div className="ticket-group">
                    <div className="form-group ticket-form-group">
                        <label className="ticket-label" htmlFor="code">Promo Code:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={promoCodeForm.code}
                            onChange={handleFormChange}
                            placeholder="e.g., SUMMER20"
                            className="ticket-select"
                            required
                        />
                    </div>

                    <div className="form-group ticket-form-group">
                        <label className="ticket-label" htmlFor="discountType">Discount Type:</label>
                        <select
                            id="discountType"
                            name="discountType"
                            value={promoCodeForm.discountType}
                            onChange={handleFormChange}
                            className="ticket-select"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₦)</option>
                        </select>
                    </div>

                    <div className="form-group ticket-form-group">
                        <label className="ticket-label" htmlFor="value">Discount Value:</label>
                        <input
                            type="number"
                            id="value"
                            name="value"
                            value={promoCodeForm.value}
                            onChange={handleFormChange}
                            placeholder={promoCodeForm.discountType === 'percentage' ? "e.g., 10 (for 10%)" : "e.g., 5000"}
                            className="ticket-select"
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group ticket-form-group">
                        <label className="ticket-label" htmlFor="usageLimit">Usage Limit (0 for unlimited):</label>
                        <input
                            type="number"
                            id="usageLimit"
                            name="usageLimit"
                            value={promoCodeForm.usageLimit}
                            onChange={handleFormChange}
                            placeholder="e.g., 100"
                            className="ticket-select"
                            min="0"
                        />
                    </div>

                    <div className="form-group ticket-form-group">
                        <label className="ticket-label" htmlFor="expiryDate">Expiry Date:</label>
                        <input
                            type="date"
                            id="expiryDate"
                            name="expiryDate"
                            value={promoCodeForm.expiryDate}
                            onChange={handleFormChange}
                            className="ticket-select"
                            required
                        />
                    </div>

                    {/* NEW: Ticket Selection - Checkboxes */}
                    <div className="form-group ticket-form-group">
                        <label className="ticket-label">Applies to Tickets:</label>
                        <div className="checkbox-group"> {/* A new div for checkbox layout */}
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    value="" // Value for "All Tickets"
                                    checked={promoCodeForm.appliesToTickets.length === 0} // Checked if no specific tickets selected
                                    onChange={handleTicketCheckboxChange}
                                    className="ticket-checkbox"
                                />
                                All Tickets
                            </label>
                            {tickets.map(ticket => (
                                <label key={ticket._id} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        value={ticket._id}
                                        checked={promoCodeForm.appliesToTickets.includes(ticket._id)}
                                        onChange={handleTicketCheckboxChange}
                                        className="ticket-checkbox"
                                        disabled={promoCodeForm.appliesToTickets.length === 0 && tickets.length > 0 && promoCodeForm.appliesToTickets.includes("")} // Disable if "All Tickets" is selected
                                    />
                                    {ticket.ticketType}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="ticket-btn-group">
                        <button type="submit" className="submit-button">Create Promo Code</button>
                    </div>
                </div>
            </form>
        </div>

        <div className="add-ticket-container" style={{ marginTop: '20px' }}>
            <h4 className="form-subtitle">Existing Promo Codes</h4>
            {promoCodes.length > 0 ? (
                <div className="tickets-list">
                    {promoCodes.map(promo => (
                        <div key={promo._id} className="ticket-group">
                            <div className="form-group ticket-form-group">
                                <label className="ticket-label">Code:</label>
                                <p style={{ color: 'var(--background-color)', fontWeight: 'bold' }}>{promo.code}</p>
                            </div>
                            <div className="form-group ticket-form-group">
                                <label className="ticket-label">Discount:</label>
                                <p>
                                    {promo.discountType === 'percentage' ? `${promo.value}%` : `₦${promo.value?.toLocaleString()}`}
                                </p>
                            </div>
                            <div className="form-group ticket-form-group">
                                <label className="ticket-label">Usage:</label>
                                <p>{promo.timesUsed} / {promo.usageLimit === 0 ? 'Unlimited' : promo.usageLimit}</p>
                            </div>
                            <div className="form-group ticket-form-group">
                                <label className="ticket-label">Expires:</label>
                                <p>{new Date(promo.expiryDate).toLocaleDateString()}</p>
                            </div>
                            {/* Display which tickets the promo code applies to - now a disabled multi-select */}
                            <div className="form-group ticket-form-group">
                                <label className="ticket-label">Applies To:</label>
                                <select
                                    multiple // Keep as multiple to show all selected
                                    disabled
                                    // Map populated ticket objects to their _ids for the value array
                                    value={promo.appliesToTickets.length > 0 ? promo.appliesToTickets.map(t => t._id) : [""]}
                                    className="ticket-select"
                                    size={Math.min(tickets.length + 1, 5)} // Adjust size dynamically
                                    style={{ backgroundColor: 'var(--background-color-light)', cursor: 'not-allowed' }}
                                >
                                    <option value="">All Tickets</option>
                                    {tickets.map(ticket => (
                                        <option key={ticket._id} value={ticket._id}>
                                            {ticket.ticketType}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="ticket-label">Status:</label>
                                <p style={{ color: promo.status === 'Expired' || promo.status === 'Closed' ? '#dc3545' : 'var(--accent-color)', fontWeight: 'bold' }}>{promo.status}</p>
                            </div>
                            <div className="ticket-btn-group">
                                {/* Toggle Status Button */}
                                {promo.status !== 'Expired' && (
                                    <button
                                        type="button"
                                        className="submit-button"
                                        style={{ backgroundColor: promo.status === 'Active' ? 'var(--accent-color)' : 'var(--background-color)' }}
                                        onClick={() => handleTogglePromoCodeStatus(promo._id, promo.status, promo.code)}
                                    >
                                        {promo.status === 'Active' ? 'Close' : 'Activate'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="remove-button"
                                    onClick={() => handleDeletePromoCode(promo._id, promo.code)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-tickets-message">No promo codes created for this event yet.</p>
            )}
        </div>
    </div>
  )
}

export default PromoCode;
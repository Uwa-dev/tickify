import React, { useState, useEffect } from 'react';
import Details from '../../../components/reuse/Details/Details';
import { ArrowLeft, BadgePercent, X, Check, TriangleAlert } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from '../../../services/eventApi';
import { 
    getTicketsOfAnEvent,
    createPromoCode,
    getPromoCodesForEvent,
    updatePromoCodeStatus,
    deletePromoCode
} from '../../../services/ticketApi';
import { toast } from 'react-toastify';
import './promo.css'
import Load from '../../../components/reuse/Load';

const PromoCode = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [promoCodeForm, setPromoCodeForm] = useState({
        code: '',
        discountType: 'percentage',
        value: '',
        usageLimit: '',
        expiryDate: '',
        appliesToTickets: [] // An empty array means 'All Tickets'
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

    // Handler specifically for the "All Tickets" checkbox
    const handleAllTicketsChange = (e) => {
        const { checked } = e.target;
        if (checked) {
            // If "All Tickets" is checked, set appliesToTickets to an empty array
            setPromoCodeForm(prev => ({ ...prev, appliesToTickets: [] }));
        }
    };

    // Handler for individual ticket checkboxes
    const handleTicketCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setPromoCodeForm(prev => {
            let newAppliesToTickets = [...prev.appliesToTickets];
            if (checked) {
                // Add the ticket to the list
                newAppliesToTickets.push(value);
            } else {
                // Remove the ticket from the list
                newAppliesToTickets = newAppliesToTickets.filter(id => id !== value);
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
                appliesToTickets: promoCodeForm.appliesToTickets || []
            });
            toast.success(response.message);
            setPromoCodes(prev => [...prev, response.data]);
            setPromoCodeForm({ code: '', discountType: 'percentage', value: '', usageLimit: '', expiryDate: '', appliesToTickets: [] });
            setShowModal(false); // Close modal after successful creation
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
        return <Load />
    }

    if (!event) {
        return <div className="error-container">
            <TriangleAlert size={130}/>
            <p>Event details not found.</p>
        </div>;
    }

    return (
        <div className="allevents-container">
            <div className='back-container' onClick={() => navigate(-1)}>
                <ArrowLeft />
                <h4>Back</h4>
            </div>

            <Details event={event} />

            <div className='heading-container'>
                <h3 className="promo-title">Promo Codes for {event.eventName}</h3>
                <button className='create-promo-btn' onClick={() => setShowModal(true)}>Create Promo Code</button>
            </div>

            {/* Modal for creating promo code */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Create</h4>
                            <button className="close-button" onClick={() => setShowModal(false)}>
                                <X size={25} className='x-button'/>
                            </button>
                        </div>
                        <form className="ticket-form" onSubmit={handleCreatePromoCode}>
                            <div >
                                <div className="ticket-form-group">
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

                                <div className="ticket-form-group">
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

                                <div className="ticket-form-group">
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

                                <div className="ticket-form-group">
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

                                <div className="ticket-form-group">
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

                                <div className="ticket-form-group checkbox-container">
                                    <label className="ticket-label">Applies to Tickets:</label>
                                    <div className="checkbox-group">
                                        <label className="custom-checkbox-label">
                                            <input
                                                type="checkbox"
                                                value=""
                                                checked={promoCodeForm.appliesToTickets.length === 0}
                                                onChange={handleAllTicketsChange}
                                                className="ticket-checkbox-hidden"
                                            />
                                            <span className="custom-checkbox">
                                                {promoCodeForm.appliesToTickets.length === 0 && <Check size={14} />}
                                            </span>
                                            All Tickets
                                        </label>
                                        {tickets.map(ticket => (
                                            <label key={ticket._id} className="custom-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={ticket._id}
                                                    checked={promoCodeForm.appliesToTickets.includes(ticket._id)}
                                                    onChange={handleTicketCheckboxChange}
                                                    className="ticket-checkbox-hidden"
                                                    // The 'disabled' attribute has been removed to allow toggling after 'All Tickets' is unchecked
                                                />
                                                <span className="custom-checkbox">
                                                    {promoCodeForm.appliesToTickets.includes(ticket._id) && <Check size={14} />}
                                                </span>
                                                {ticket.ticketType}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="ticket-btn-group">
                                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="create-btn">Create</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="promo-container" >
                {promoCodes.length > 0 ? (
                    <div className="tickets-list">
                        {promoCodes.map(promo => (
                            <div key={promo._id} className="ticket-group">
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Code:</label>
                                    <p style={{ color: 'var(--background-color)', fontWeight: 'bold' }}>{promo.code}</p>
                                </div>
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Discount:</label>
                                    <p>
                                        {promo.discountType === 'percentage' ? `${promo.value}%` : `₦${promo.value?.toLocaleString()}`}
                                    </p>
                                </div>
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Usage:</label>
                                    <p>{promo.timesUsed} / {promo.usageLimit === 0 ? 'Unlimited' : promo.usageLimit}</p>
                                </div>
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Expires:</label>
                                    <p>{new Date(promo.expiryDate).toLocaleDateString()}</p>
                                </div>
                                {/* Display which tickets the promo code applies to */}
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Applies To:</label>
                                    <p>
                                        {promo.appliesToTickets && promo.appliesToTickets.length > 0 ?
                                            promo.appliesToTickets.map(ticket => ticket.ticketType).join(', ') :
                                            'All Tickets'
                                        }
                                    </p>
                                </div>
                                <div className="ticket-form-group">
                                    <label className="ticket-label">Status:</label>
                                    <p style={{ color: promo.status === 'Expired' || promo.status === 'Closed' ? '#dc3545' : 'var(--accent-color)', fontWeight: 'bold' }}>{promo.status}</p>
                                </div>
                                <div className="ticket-btn-group">
                                    {/* Toggle Status Button */}
                                    {promo.status !== 'Expired' && (
                                        <button
                                            type="button"
                                            className="close-btn"
                                            style={{ backgroundColor: promo.status === 'Active' ? 'var(--accent-color)' : 'var(--background-color)' }}
                                            onClick={() => handleTogglePromoCodeStatus(promo._id, promo.status, promo.code)}
                                        >
                                            {promo.status === 'Active' ? 'Close' : 'Activate'}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={() => handleDeletePromoCode(promo._id, promo.code)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='no-tickets-container'>
                        <BadgePercent size={70} className='promo-icon'/>
                        <p className="no-tickets-message">No promo codes created for this event. </p>
                        <button className='animated-outline-button' onClick={() => setShowModal(true)}>Create Promo Code</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PromoCode;
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import '../Events/viewEvents.css';
import '../Events/event.css';
import Details from '../../components/reuse/Details/Details';
import { getEventSalesSummary } from '../../services/ticketApi';

// Define a default goal for "unlimited" tickets for progress calculation
const DEFAULT_UNLIMITED_GOAL = 200;

const SalesSummary = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState({
        summary: [],
        attendees: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getEventSalesSummary(eventId);
                setEvent(data.event);
                setSalesData({
                    summary: data.ticketSummary,
                    attendees: data.attendees
                });
            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Filter summary to only include tickets from this event
    const eventTicketTypes = event?.tickets?.map(t => t.ticketType) || [];
    const validSummary = salesData.summary.filter(item =>
        eventTicketTypes.includes(item.ticketType)
    );

    const calculateProgressPercent = (sold, quantity) => {
        let totalForProgress = quantity;

        // If quantity is the "unlimited" sentinel value, use a default goal
        if (quantity === 9007199254740991) {
            totalForProgress = DEFAULT_UNLIMITED_GOAL;
        }

        // Handle cases where totalForProgress is 0 to avoid division by zero
        if (totalForProgress === 0) {
            return 0;
        }

        // Calculate percentage, ensuring it doesn't exceed 100%
        const percentage = (sold / totalForProgress) * 100;
        return Math.round(Math.min(percentage, 100)); // Cap at 100%
    };

    const getProgressStatus = (available) => {
        return available === 0 ? 'exception' : 'active';
    };

    if (loading) {
        return <div className="loading-container">Loading sales data...</div>;
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

            <div className="sales-summary-container">
                <h2>Sales Summary</h2>

                <div className="summary-cards">
                    {validSummary.map(ticket => (
                        <div key={ticket._id} className="summary-card">
                            <h3>{ticket.ticketType || 'General Admission'}</h3>
                            <div className="sales-stats">
                                <span>Sold: {ticket.sold}</span>
                                <span>Available: {ticket.available}</span>
                                {/* Ensure ticket.price is available, otherwise default to 0 */}
                                <span>Revenue: ₦{(ticket.sold * (ticket.price || 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="tables-container">
                    <div className="summary-table">
                        <h3>Ticket Sales Breakdown</h3>
                        <div className="table-responsive">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Ticket Type</th>
                                    <th>Price</th>
                                    <th>Sold</th>
                                    <th>Available</th>
                                    <th>Sales Progress</th>
                                </tr>
                                </thead>
                                <tbody>
                                {validSummary.map(ticket => (
                                    <tr key={ticket._id}>
                                    <td>
                                        <span className="ticket-type-badge">
                                        {ticket.ticketType || 'General Admission'}
                                        </span>
                                    </td>
                                    {/* Ensure ticket.price is available, otherwise default to 0 */}
                                    <td>₦{(ticket.price || 0).toFixed(2)}</td>
                                    <td>{ticket.sold || 0}</td>
                                    <td>{ticket.quantity === 9007199254740991 ? "Unlimited" : ticket.quantity || 0}</td>
                                    <td>
                                        <div className="progress-container">
                                        <div
                                            className={`progress-bar ${getProgressStatus(ticket.available)}`}
                                            style={{ width: `${calculateProgressPercent(ticket.sold, ticket.quantity)}%` }}
                                        ></div>
                                        <span className="progress-text">
                                            {calculateProgressPercent(ticket.sold, ticket.quantity)}%
                                        </span>
                                        </div>
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="attendees-table">
                        <h3>Attendees List</h3>
                        <div className="table-responsive">
                            <table className="sales-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Ticket Type</th>
                                        <th>Purchase Date</th>
                                        <th>Amount Paid</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesData.attendees.map(attendee => (
                                        <tr key={attendee._id}>
                                            <td>{attendee.buyer.fullName}</td>
                                            <td>{attendee.buyer.email}</td>
                                            {/* Ensure attendee.ticket exists before accessing ticketType */}
                                            <td>{attendee.ticket?.ticketType || 'N/A'}</td>
                                            <td>{new Date(attendee.createdAt).toLocaleDateString()}</td>
                                            <td>₦{(attendee.totalAmount || 0).toFixed(2)}</td>
                                            <td>
                                                {/* Add a fallback for attendee.status before calling toLowerCase() */}
                                                <span className={`status-badge ${(attendee.status || '').toLowerCase()}`}>
                                                    {attendee.status || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesSummary;
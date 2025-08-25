import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import './summary.css'
import Details from '../../../components/reuse/Details/Details';
import { getEventSalesSummary } from '../../../services/ticketApi';
import { getEventById } from '../../../services/eventApi';
import Load from '../../../components/reuse/Load';
import * as XLSX from 'xlsx';

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

                const eventData = await getEventById(eventId);
                setEvent(eventData);

                const salesData = await getEventSalesSummary(eventId);
                console.log("Sales Data:", salesData); // Debug log
                
                // Check the structure of the response
                if (salesData && salesData.ticketSummary) {
                    setSalesData({
                        summary: salesData.ticketSummary,
                        attendees: salesData.attendees || []
                    });
                } else {
                    console.error("Unexpected sales data structure:", salesData);
                    setSalesData({
                        summary: [],
                        attendees: []
                    });
                }

            } catch (error) {
                console.error("Failed to fetch sales data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Function to export attendees to Excel
    const exportToExcel = () => {
        if (!salesData.attendees || salesData.attendees.length === 0) {
            alert('No attendees data to export');
            return;
        }

        // Prepare data for Excel
        const excelData = salesData.attendees.map(attendee => ({
            'Name': attendee.buyer?.fullName || 'N/A',
            'Email': attendee.buyer?.email || 'N/A',
            'Ticket Type': attendee.ticket?.ticketType || 'N/A',
            'Purchase Date': formatPurchaseDate(attendee.purchaseDate),
            'Amount Paid': `₦${(attendee.totalAmount || 0).toFixed(2)}`,
            'Check-In Status': attendee.checkInStatus ? 'Checked In' : 'Not Checked In',
            'Quantity': attendee.quantity || 0,
            'Phone Number': attendee.buyer?.phoneNumber || 'N/A',
            'Payment Method': attendee.paymentMethod || 'N/A',
            'Payment Reference': attendee.paymentReference || 'N/A'
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
        
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Create blob and download
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event?.eventName || 'Event'}_Attendees_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Get valid summary data - use all available ticket data
    const validSummary = salesData.summary.length > 0 
        ? salesData.summary 
        : (event?.tickets || []).map(ticket => ({
            _id: ticket._id,
            ticketType: ticket.ticketType,
            price: ticket.price,
            sold: 0,
            quantity: ticket.quantity,
            available: ticket.quantity
        }));

    const calculateProgressPercent = (sold, quantity) => {
        // Handle unlimited tickets (sentinel value 9007199254740991)
        if (quantity === 9007199254740991) {
            const percentage = (sold / DEFAULT_UNLIMITED_GOAL) * 100;
            return Math.round(Math.min(percentage, 100));
        }
        
        // Handle cases where quantity is 0 to avoid division by zero
        if (quantity === 0) {
            return 0;
        }

        // Calculate percentage, ensuring it doesn't exceed 100%
        const percentage = (sold / quantity) * 100;
        return Math.round(Math.min(percentage, 100));
    };

    const getProgressStatus = (sold, quantity) => {
        if (quantity === 9007199254740991) return 'active'; // Unlimited tickets
        return sold >= quantity ? 'exception' : 'active';
    };

    // Helper function to format date safely
    const formatPurchaseDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'N/A';
        }
    };

    if (loading) {
        return <Load />;
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
                <h2 className='form-title'>Sales Summary</h2>

                {validSummary.length > 0 ? (
                    <>
                        <div className="summary-cards">
                            {validSummary.map(ticket => (
                                <div key={ticket._id} className="summary-card">
                                    <h3>{ticket.ticketType || 'General Admission'}</h3>
                                    <div className="sales-stats">
                                        <span>Sold: {ticket.sold || 0}</span>
                                        <span>Available: {ticket.quantity === 9007199254740991 ? "Unlimited" : (ticket.quantity || 0) - (ticket.sold || 0)}</span>
                                        <span>Revenue: ₦{((ticket.sold || 0) * (ticket.price || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="tables-container">
                            <div className="summary-table">
                                <h3 className='form-title'>Ticket Sales Breakdown</h3>
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
                                                    <td>₦{(ticket.price || 0).toFixed(2)}</td>
                                                    <td>{ticket.sold || 0}</td>
                                                    <td>{ticket.quantity === 9007199254740991 ? "Unlimited" : (ticket.quantity || 0) - (ticket.sold || 0)}</td>
                                                    <td>
                                                        <div className="progress-container">
                                                            <div
                                                                className={`progress-bar ${getProgressStatus(ticket.sold || 0, ticket.quantity || 0)}`}
                                                                style={{ width: `${calculateProgressPercent(ticket.sold || 0, ticket.quantity || 0)}%` }}
                                                            ></div>
                                                            <span className="progress-text">
                                                                {calculateProgressPercent(ticket.sold || 0, ticket.quantity || 0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-data-message">
                        <p>No ticket sales data available for this event.</p>
                    </div>
                )}

                <div className="attendees-table">
                    <div className='attendees-table-header'>
                        <h3 className='form-title'>Attendees List</h3>
                        <p className="excel-download" onClick={exportToExcel}>
                            <Download size={16} />
                            Sheet
                        </p>
                    </div>
                    <div className="table-responsive">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Ticket Type</th>
                                    <th>Purchase Date</th>
                                    <th>Amount Paid</th>
                                    <th>Check-In Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.attendees && salesData.attendees.length > 0 ? (
                                    salesData.attendees.map(attendee => (
                                        <tr key={attendee._id}>
                                            <td>{attendee.buyer?.fullName || 'N/A'}</td>
                                            <td>{attendee.buyer?.email || 'N/A'}</td>
                                            <td>{attendee.ticket?.ticketType || 'N/A'}</td>
                                            <td>{formatPurchaseDate(attendee.purchaseDate)}</td>
                                            <td>₦{(attendee.totalAmount || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${attendee.checkInStatus ? 'checked-in' : 'not-checked-in'}`}>
                                                    {attendee.checkInStatus ? 'Checked In' : 'Not Checked In'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data-cell">
                                            No attendees yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesSummary;
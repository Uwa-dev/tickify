import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTicketsOfAnEvent, deleteTicket } from '../../services/ticketApi'; // Import deleteTicket
import { getEventById } from '../../services/eventApi';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import './event.css';
import './viewEvents.css';
import Details from '../../components/reuse/Details';

const ManageEventTickets = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null); // State to store event details
  const [tickets, setTickets] = useState([]); // State to store tickets for the event
  const [loading, setLoading] = useState(true); // Loading state

  // Function to fetch both event details and its tickets
  const fetchEventAndTickets = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot fetch tickets or event details.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await getEventById(eventId);
      // Directly use eventResponse as fetchedEvent, as eventApi.getEventById returns the event object directly
      const fetchedEvent = eventResponse;

      if (fetchedEvent) {
        setEvent(fetchedEvent);
      } else {
        toast.error("Event details not found or invalid response from API.");
        setEvent(null); // Explicitly set event to null if not found
      }

      // Fetch tickets for the event
      const ticketsResponse = await getTicketsOfAnEvent(eventId);
      setTickets(ticketsResponse.data.tickets); // Assuming tickets are in response.data.tickets

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load event or tickets.");
      console.error("Error fetching event and tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to call the fetch function when eventId or navigate changes
  useEffect(() => {
    fetchEventAndTickets();
  }, [eventId, navigate]);

  // New: Handle Ticket Deletion
  const handleDeleteTicket = async (ticketId, ticketType) => {
    // IMPORTANT: For a production app, replace window.confirm with a custom modal for better UX.
    // This is a simple placeholder for immediate functionality.
    if (window.confirm(`Are you sure you want to delete the "${ticketType}" ticket? This action cannot be undone.`)) {
      try {
        await deleteTicket(ticketId); // Call the delete API from services/ticketApi.js
        toast.success(`Ticket "${ticketType}" deleted successfully!`);
        // Update the UI by removing the deleted ticket from the local state
        setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketId));
      } catch (error) {
        toast.error(error.message || `Failed to delete "${ticketType}" ticket.`);
        console.error("Error deleting ticket:", error);
      }
    }
  };

  // Show loading indicator
  if (loading) {
    return <div className="loading-container">Loading tickets...</div>;
  }

  // Show error if event details couldn't be loaded
  if (!event) {
    return <div className="error-container">Event details not found.</div>;
  }

  return (
    <div className="allevents-container"> {/* Main container for the page */}

      <div className='back-container' onClick={() => navigate(-1)}>
        <ArrowLeft />
        <h4>Back</h4>
      </div>

      {/* Details component to display event information */}
      <Details event={event} />

      <div className='heading-container'>
        <h3 className="form-title">Manage Tickets for Event: {event.eventName || eventId}</h3> {/* Display event name or ID */}
        <Link to={`/events/${eventId}/create-ticket`} className="add-ticket-btn">Create more Tickets</Link>
      </div>

      <div className="ticket-list-wrapper"> {/* A wrapper for consistent styling if needed, otherwise remove */}
        <div className="tickets-list"> {/* Container for the list of ticket cards */}
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div key={ticket._id} className="ticket-group"> {/* Card for each individual ticket */}
                <div className="form-group ticket-form-group">
                  <label className="ticket-label">Ticket Type:</label>
                  <p>{ticket.ticketType}</p>
                </div>

                <div className="form-group ticket-form-group">
                  <label className="ticket-label">Price:</label>
                  <p>₦{ticket.price?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="form-group ticket-form-group">
                  <label className="ticket-label">Quantity:</label>
                  <p>{ticket.quantity === 9007199254740991 ? "Unlimited" : ticket.quantity}</p>
                </div>

                <div className="form-group">
                  <label className="ticket-label">Transfer Fee:</label>
                  <p>{ticket.transferFee ? 'Yes' : 'No'}</p>
                </div>

                <div className="ticket-btn-group"> {/* Button group for actions on each ticket */}
                  <Link to={`/ticket/${ticket._id}`} className="remove-button"> {/* Using remove-button for general action styling */}
                    Edit Ticket Details
                  </Link>

                  {/* Delete Button - Now functional */}
                  <button
                    type="button"
                    className="remove-button" // Apply styling for delete button
                    onClick={() => handleDeleteTicket(ticket._id, ticket.ticketType)}
                  >
                    Delete Ticket
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-tickets-message">No tickets found for this event. <Link to={`/events/${eventId}/create-ticket`} className="add-ticket-button">Create one?</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEventTickets;
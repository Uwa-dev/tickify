import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTicketsOfAnEvent, deleteTicket, updateTicket, getTicketById } from '../../../services/ticketApi';
import { getEventById } from '../../../services/eventApi';
import { toast } from 'react-toastify';
import { ArrowLeft, X } from 'lucide-react';
import './manage.css';
import Details from '../../../components/reuse/Details/Details';
import Load from '../../../components/reuse/Load';

const ManageEventTickets = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

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

  // Handle opening the update modal
  const handleOpenUpdateModal = async (ticketId) => {
    try {
      setUpdateLoading(true);
      const response = await getTicketById(ticketId);
      const ticketData = response.data;
      
      setCurrentTicket({
        _id: ticketData._id,
        name: ticketData.ticketType,
        price: ticketData.price,
        quantity: ticketData.quantity === 9007199254740991 ? '' : ticketData.quantity,
        unlimited: ticketData.quantity === 9007199254740991,
        transferFee: ticketData.transferFee
      });
      
      setShowUpdateModal(true);
    } catch (error) {
      toast.error("Failed to load ticket details");
      console.error("Error loading ticket:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle closing the update modal
  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setCurrentTicket(null);
  };

  // Handle changes in the update form
  const handleTicketChange = (field, value) => {
    setCurrentTicket(prev => ({ ...prev, [field]: value }));
  };

  // Handle unlimited checkbox change
  const handleUnlimitedChange = (checked) => {
    setCurrentTicket(prev => ({
      ...prev,
      unlimited: checked,
      quantity: checked ? '' : prev.quantity
    }));
  };

  // Handle ticket update submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Basic validation for name and price
      if (!currentTicket.name || !currentTicket.price) {
        throw new Error("Please fill all required fields (Ticket Type, Price).");
      }

      // Specific validation for quantity based on 'unlimited' status
      let finalQuantity;
      if (currentTicket.unlimited) {
        finalQuantity = 9007199254740991; // Sentinel value for unlimited
      } else {
        const parsedQuantity = parseInt(currentTicket.quantity);
        // Validate if quantity is a valid number and greater than 0
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          throw new Error("Quantity must be a positive number for non-unlimited tickets.");
        }
        finalQuantity = parsedQuantity;
      }

      const payload = {
        ticketType: currentTicket.name,
        price: parseFloat(currentTicket.price),
        quantity: finalQuantity,
        transferFee: currentTicket.transferFee,
        unlimited: currentTicket.unlimited
      };

      await updateTicket(eventId, currentTicket._id, payload);
      toast.success("Ticket updated successfully!");
      
      // Refresh the tickets list
      await fetchEventAndTickets();
      
      // Close the modal
      handleCloseUpdateModal();
    } catch (error) {
      console.error("Error updating ticket:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update ticket";
      const backendErrors = error.response?.data?.errors;

      if (backendErrors && backendErrors.length > 0) {
        backendErrors.forEach(err => toast.error(err));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle Ticket Deletion
  const handleDeleteTicket = async (ticketId, ticketType) => {
    if (window.confirm(`Are you sure you want to delete the "${ticketType}" ticket? This action cannot be undone.`)) {
      try {
        await deleteTicket(ticketId);
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
    return <div><Load /></div>;
  }

  // Show error if event details couldn't be loaded
  if (!event) {
    return <div className="error-container">
      <TriangleAlert size={130}/>
      <p> No event found</p>
    </div>;
  }

  return (
    <div className="allevents-container">
      <div className='back-container' onClick={() => navigate(-1)}>
        <ArrowLeft />
        <h4>Back</h4>
      </div>

      {/* Details component to display event information */}
      <Details event={event} />

      <div className='heading-container'>
        <h3 className="form-title">Manage Tickets for {event.eventName || eventId}</h3>
        <Link to={`/events/${eventId}/create-ticket`} className="add-ticket-btn">Create more Tickets</Link>
      </div>

      <div className="ticket-list-wrapper"> 
        <div className="tickets-list"> 
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div key={ticket._id} className="ticket-group">
                <div className="ticket-form-group">
                  <label className="ticket-label">Ticket Type:</label>
                  <p>{ticket.ticketType}</p>
                </div>

                <div className="ticket-form-group">
                  <label className="ticket-label">Price:</label>
                  <p>₦{ticket.price?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="ticket-form-group">
                  <label className="ticket-label">Quantity:</label>
                  <p>{ticket.quantity === 9007199254740991 ? "Unlimited" : ticket.quantity}</p>
                </div>

                <div className="ticket-form-group">
                  <label className="ticket-label">Transfer Fee:</label>
                  <p>{ticket.transferFee ? 'Yes' : 'No'}</p>
                </div>

                <div className="ticket-btn-group">
                  <button 
                    className='remove-button'
                    onClick={() => handleOpenUpdateModal(ticket._id)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleDeleteTicket(ticket._id, ticket.ticketType)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-tickets-message">No tickets found for this event. <Link to={`/events/${eventId}/create-ticket`} className="add-ticket-button">Create one?</Link></p>
          )}
        </div>
      </div>

      {/* Update Ticket Modal */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Ticket</h3>
              <button className="modal-close" onClick={handleCloseUpdateModal}>
                <X size={20} className='x-button'/>
              </button>
            </div>
            
            {updateLoading ? (
              <div className="modal-loading">Loading ticket details...</div>
            ) : currentTicket ? (
              <form className="ticket-form" onSubmit={handleUpdateSubmit}>
                <div className="ticket-group">
                  <div className="ticket-form-group">
                    <label className="ticket-label">Ticket Type:</label>
                    <input
                      type="text"
                      value={currentTicket.name}
                      onChange={(e) => handleTicketChange('name', e.target.value)}
                      placeholder="Single/Group/VIP"
                      className="ticket-select"
                      required
                    />
                  </div>

                  <div className="ticket-form-group">
                    <label className="ticket-label">Price:</label>
                    <input
                      type="number"
                      value={currentTicket.price}
                      onChange={(e) => handleTicketChange('price', e.target.value)}
                      placeholder="Enter price"
                      className="ticket-select"
                      required
                      min="0"
                    />
                  </div>

                  <div className="ticket-form-group">
                    <label className="ticket-label">Quantity:</label>
                    <input
                      type="number"
                      value={currentTicket.unlimited ? '' : currentTicket.quantity}
                      onChange={(e) => handleTicketChange('quantity', e.target.value)}
                      placeholder={currentTicket.unlimited ? 'Unlimited' : 'Enter quantity'}
                      className="ticket-select"
                      disabled={currentTicket.unlimited}
                      required={!currentTicket.unlimited}
                      min="1"
                    />
                  </div>

                  <div className="ticket-form-group">
                    <label>
                      <input
                        type="checkbox"
                        className='ticket-checkbox'
                        checked={currentTicket.unlimited}
                        onChange={(e) => handleUnlimitedChange(e.target.checked)}
                      />
                      Unlimited ticket quantity
                    </label>
                  </div>

                  <div className="ticket-form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentTicket.transferFee}
                        onChange={(e) => handleTicketChange('transferFee', e.target.checked)}
                        className='ticket-checkbox'
                      />
                      Transfer fees to guest
                    </label>
                  </div>

                  <div className="ticket-btn-group">
                    <button
                      type="button"
                      className="remove-button"
                      onClick={handleCloseUpdateModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="remove-button"
                    >
                      Update Ticket
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="modal-error">Error loading ticket details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEventTickets;
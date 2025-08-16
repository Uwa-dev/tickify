import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getTicketById, updateTicket } from '../../services/ticketApi';
import { toast } from 'react-toastify';
import './event.css'
// import PromoCodeModal from './PromoCodeModal'; // Uncomment if you create this component

const UpdateTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState({
    name: '',
    price: '',
    quantity: '',
    unlimited: false,
    transferFee: false
  });
  const [eventId, setEventId] = useState(null); // State to store the eventId
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await getTicketById(ticketId);
        const ticketData = response.data; // Assuming response.data is the ticket object

        setTicket({
          name: ticketData.ticketType,
          price: ticketData.price,
          quantity: ticketData.quantity === 9007199254740991 ? '' : ticketData.quantity,
          unlimited: ticketData.quantity === 9007199254740991,
          transferFee: ticketData.transferFee
        });
        setEventId(ticketData.event); // Set the eventId from the fetched ticket data
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load ticket");
        console.error("Error loading ticket:", error);
        navigate(-1); // Go back if ticket fails to load
      }
    };

    fetchTicket();
  }, [ticketId, navigate]); // Depend on ticketId and navigate

  const handleTicketChange = (field, value) => {
    setTicket(prev => ({ ...prev, [field]: value }));
  };

  const handleUnlimitedChange = (checked) => {
    setTicket(prev => ({
      ...prev,
      unlimited: checked,
      quantity: checked ? '' : prev.quantity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Basic validation for name and price
      if (!ticket.name || !ticket.price) {
        throw new Error("Please fill all required fields (Ticket Type, Price).");
      }

      // Specific validation for quantity based on 'unlimited' status
      let finalQuantity;
      if (ticket.unlimited) {
        finalQuantity = 9007199254740991; // Sentinel value for unlimited
      } else {
        const parsedQuantity = parseInt(ticket.quantity);
        // Validate if quantity is a valid number and greater than 0
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          throw new Error("Quantity must be a positive number for non-unlimited tickets.");
        }
        finalQuantity = parsedQuantity;
      }

      // Validate eventId is available before submitting
      if (!eventId) {
        throw new Error("Event ID not found for this ticket. Cannot update.");
      }

      const payload = {
        ticketType: ticket.name,
        price: parseFloat(ticket.price),
        quantity: finalQuantity, // Use the validated quantity
        transferFee: ticket.transferFee,
        unlimited: ticket.unlimited
      };

      // Pass eventId along with ticketId and payload
      await updateTicket(eventId, ticketId, payload);
      toast.success("Ticket updated successfully!");
      navigate(-1); // Go back to previous page after successful update
    } catch (error) {
      console.error("Error updating ticket:", error); // Log the full error object

      const errorMessage = error.response?.data?.message || error.message || "Failed to update ticket";
      const backendErrors = error.response?.data?.errors; // Get the specific errors array from backend

      if (backendErrors && backendErrors.length > 0) {
        // If specific errors are provided by the backend, display each one
        backendErrors.forEach(err => toast.error(err));
      } else {
        // Otherwise, display the general error message (from backend or Axios)
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return <div className="ticket-parent">Loading...</div>;
  }

  return (
    <div className="ticket-parent">
      <div className="add-ticket-container">
        <h3 className="form-title">Update Ticket</h3>
        <form className="ticket-form" onSubmit={handleSubmit}>
          <div className="ticket-group">
            <div className="form-group ticket-form-group">
              <label className="ticket-label">Ticket Type:</label>
              <input
                type="text"
                value={ticket.name}
                onChange={(e) => handleTicketChange('name', e.target.value)}
                placeholder="Single/Group/VIP"
                className="ticket-select"
                required
              />
            </div>

            <div className="form-group ticket-form-group">
              <label className="ticket-label">Price:</label>
              <input
                type="number"
                value={ticket.price}
                onChange={(e) => handleTicketChange('price', e.target.value)}
                placeholder="Enter price"
                className="ticket-select"
                required
                min="0"
              />
            </div>

            <div className="form-group ticket-form-group">
              <label className="ticket-label">Quantity:</label>
              <input
                type="number"
                value={ticket.unlimited ? '' : ticket.quantity}
                onChange={(e) => handleTicketChange('quantity', e.target.value)}
                placeholder={ticket.unlimited ? 'Unlimited' : 'Enter quantity'}
                className="ticket-select"
                disabled={ticket.unlimited}
                required={!ticket.unlimited}
                min="1"
              />
            </div>

            <div className="form-group ticket-form-group">
              <label>
                <input
                  type="checkbox"
                  className='ticket-checkbox'
                  checked={ticket.unlimited}
                  onChange={(e) => handleUnlimitedChange(e.target.checked)}
                />
                Unlimited ticket quantity
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={ticket.transferFee}
                  onChange={(e) => handleTicketChange('transferFee', e.target.checked)}
                  className='ticket-checkbox'
                />
                Transfer fees to guest
              </label>
            </div>

            <button
              type="submit"
              className="submit-button"
            >
              Update Ticket
            </button>
          </div>
        </form>
      </div>

      {/* Promo Code Modal */}
      {showPromoModal && (
        <PromoCodeModal
          ticketId={ticketId}
          onClose={() => setShowPromoModal(false)}
        />
      )}
    </div>
  );
};

export default UpdateTicket;
import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import './event.css';
import { createTicket } from '../../services/ticketApi';
import { toast } from 'react-toastify';

const AddTicket = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([
    { name: '', price: '', quantity: '', unlimited: false, transferFee: false },
  ]);

  const handleAddTicket = () => {
    setTickets([
      ...tickets,
      { name: '', price: '', quantity: '', unlimited: false, transferFee: false },
    ]);
  };

  console.log("Event ID from URL:", eventId);

  const handleRemoveTicket = (index) => {
    if (tickets.length <= 1) {
      toast.error("You must have at least one ticket");
      return;
    }
    const updatedTickets = tickets.filter((_, i) => i !== index);
    setTickets(updatedTickets);
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...tickets];
    updatedTickets[index][field] = value;
    setTickets(updatedTickets);
  };

  const handleUnlimitedChange = (index, checked) => {
    const updatedTickets = [...tickets];
    updatedTickets[index].unlimited = checked;
    if (checked) {
      updatedTickets[index].quantity = 'Unlimited';
    } else {
      updatedTickets[index].quantity = '';
    }
    setTickets(updatedTickets);
  };


  const handleSaveAllTickets = async (e) => {
    e.preventDefault();
    
    try {
      // Validate all tickets first
      for (const ticket of tickets) {
        if (!ticket.name || !ticket.price || (!ticket.unlimited && !ticket.quantity)) {
          throw new Error("Please fill all required fields for all tickets");
        }
      }

      // Save all tickets
      for (const ticket of tickets) {
        const payload = {
          eventId,
          ticketType: ticket.name,
          price: ticket.price,
          quantity: ticket.unlimited ? 'Unlimited' : ticket.quantity,
          transferFee: ticket.transferFee,
        };
        await createTicket(payload);
      }

      toast.success("All tickets saved successfully!");
      navigate(`/events/details/${eventId}`);// Redirect after successful save 
    } catch (error) {
      toast.error(error.message || "Failed to save tickets");
      console.error(error);
    }
  };

  return (
    <div className="ticket-parent">
      <div className="add-ticket-container">
        <h3 className="form-title">Add Tickets</h3>
        <form className="ticket-form" onSubmit={handleSaveAllTickets}>
          {tickets.map((ticket, index) => (
            <div key={index} className="ticket-group">
              <div className="form-group ticket-form-group">
                <label className="ticket-label">Ticket Type:</label>
                <input
                  type="text"
                  value={ticket.name}
                  onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
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
                  onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
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
                  onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
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
                    onChange={(e) => handleUnlimitedChange(index, e.target.checked)}
                  />
                  Unlimited ticket quantity
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={ticket.transferFee}
                    onChange={(e) => handleTicketChange(index, 'transferFee', e.target.checked)}
                    className='ticket-checkbox'
                  />
                  Transfer fees to guest
                </label>
              </div>

              <div className="ticket-btn-group">
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => handleRemoveTicket(index)}
                >
                  Remove
                </button>
                
                <button
                  type="button"
                  className="add-ticket-button"
                  onClick={handleAddTicket}
                >
                  Add Another Ticket
                </button>
              </div>
            </div>
          ))}

          

          <button 
            type="submit" 
            className="submit-button"
          >
            Finish
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTicket;
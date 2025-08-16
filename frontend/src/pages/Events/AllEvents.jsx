import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from "lucide-react";
import "./viewEvents.css"; // Ensure this CSS file contains necessary styles
import { getEventsByOrganizer } from '../../services/eventApi';
import { getEventSalesSummary } from '../../services/ticketApi'; // Import the sales summary API
import { toast } from 'react-toastify';

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [eventSales, setEventSales] = useState({}); // State to store sales data for each event
  const [loadingEvents, setLoadingEvents] = useState(true); // Loading state for initial events fetch
  const [loadingSales, setLoadingSales] = useState(true); // Loading state for sales data fetch

  useEffect(() => {
    const fetchAllEventsAndSales = async () => {
      setLoadingEvents(true);
      try {
        const fetchedEvents = await getEventsByOrganizer();
        setEvents(fetchedEvents);
        setLoadingEvents(false);
        console.log("1. Fetched Events:", fetchedEvents); // DEBUG LOG

        // Now, fetch sales for each event
        setLoadingSales(true);
        const salesDataPromises = fetchedEvents.map(async (event) => {
          try {
            const salesSummaryResponse = await getEventSalesSummary(event._id);
            console.log(`2. Sales Summary Response for Event ${event._id}:`, salesSummaryResponse); // DEBUG LOG

            // FIXED: Calculate totalTicketsSold by summing 'sold' from ticketSummary
            const totalSold = salesSummaryResponse.ticketSummary.reduce((sum, ticketType) => {
                return sum + (ticketType.sold || 0);
            }, 0);

            console.log(`3. Calculated Total Tickets Sold for Event ${event._id}:`, totalSold); // DEBUG LOG
            return { eventId: event._id, totalTicketsSold: totalSold };
          } catch (salesError) {
            console.error(`Error fetching sales for event ${event._id}:`, salesError);
            toast.error(`Failed to load sales for event: ${event.eventName}`);
            return { eventId: event._id, totalTicketsSold: 'N/A' }; // Indicate error
          }
        });

        const allSalesResults = await Promise.all(salesDataPromises);
        const newEventSales = {};
        allSalesResults.forEach(item => {
          newEventSales[item.eventId] = item.totalTicketsSold;
        });
        setEventSales(newEventSales);
        setLoadingSales(false);
        console.log("4. Final eventSales state:", newEventSales); // DEBUG LOG

      } catch (error) {
        toast.error("Failed to fetch events or sales data.");
        console.error("Error in fetchAllEventsAndSales (outer catch):", error); // DEBUG LOG for outer catch
        setLoadingEvents(false);
        setLoadingSales(false);
      }
    };

    fetchAllEventsAndSales();
  }, []); // Empty dependency array means this runs once on component mount

  if (loadingEvents) {
    return (
      <div className='allevents-container'>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className='allevents-container'>
      <div className='allevents-grid-container'>
        {events.length === 0 ? (
          <div>
            <p>No events found.</p>
          </div>
        ) : (
          events.map(event => (
            <Link to={`/events/details/${event._id}`} className='event-container-link' key={event._id}>
              <div className='event-container'>
                <div className='event-info'>
                  <div>
                    <h4>{event.eventName}</h4>
                    <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className='event-info-bottom'>
                    <div className='ticket-sold-container'>
                      <Ticket />
                      {/* Display tickets sold, show loading indicator or N/A if still fetching/error */}
                      {loadingSales ? (
                        <p>...</p>
                      ) : (
                        <p>{eventSales[event._id] !== undefined ? eventSales[event._id] : 'N/A'}</p>
                      )}
                    </div>
                    <p>Tickets Sold</p>
                  </div>
                </div>
                <div className='event-image'>
                  {/* Provide a fallback image or placeholder if event.eventImage is missing */}
                  <img src={event.eventImage || 'https://placehold.co/150x100/eeeeee/333333?text=No+Image'} alt={event.eventName} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default AllEvents;
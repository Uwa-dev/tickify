import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllPublishedEvents } from '../../../services/publicApi';
import Load from '../../../components/reuse/Load';
import Logo from '../../../assets/Tickify.png';
import {CalendarX2} from "lucide-react";
import '../public.css';
import './listingPage.css'

const EventListingPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await getAllPublishedEvents();
        
        // Filter out events without customTicketUrl
        const validEvents = data.filter(event => event.customTicketUrl);
        console.log("Valid events:", validEvents);
        
        if (validEvents.length !== data.length) {
          console.warn(`${data.length - validEvents.length} events were excluded due to missing customTicketUrl`);
        }
        
        setEvents(validEvents);
      } catch (error) {
        console.error("Failed to load events:", error);
        setError("Failed to load events. Please try again later.");
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEventClick = (fullUrl) => {
    if (!fullUrl) {
      toast.error("This event is not properly configured");
      return;
    }
    
    // Extract just the last part of the URL
    const slug = fullUrl.split('/').pop();
    navigate(`/events/${slug}`);
  };

  if (loading) return <Load />;
  if (events.length === 0 || error) return (
    <div className="public-container">
      <div className='no-event-container'>
        <div className='no-event-logo'>
          <img src={Logo} alt="" />
        </div>
        <h1>We have no available events at this time.</h1>
        < CalendarX2 size={50}/>
      </div>
    </div>
  );

  return (
    <div className="public-event-page">
      <div className='public-event-header'>
        <div className='logo-img-container'>
          <img src={Logo} alt="" />
        </div>
        {/* <div>
          <button>View Events</button>
          <Link to="/events/listing" className="button">View Events</Link>
        </div> */}
      </div>

      <h1 className="page-title">Upcoming Events</h1>
      
      <div className="event-grid">
        {events.map((event) => (
          <div 
            key={event._id} 
            className="event-card"
            onClick={() => handleEventClick(event.customTicketUrl)}
          >
            <div className="event-image-container">
              <img 
                src={event.eventImage || '/default-event.jpg'} 
                alt={event.eventName} 
                className="event-image"
                onError={(e) => {
                  e.target.src = '/default-event.jpg';
                }}
              />
            </div>

            <div className="event-details">
              <h3 className="event-name">{event.eventName}</h3>
              <div className="event-meta">
                <p className="event-date">
                  <i className="fa fa-calendar"></i> {formatDate(event.startDate)}
                </p>
                <p className="event-location">
                  <i className="fa fa-map-marker"></i> {event.location || 'Online'}
                </p>
              </div>
              <p className="event-description">
                {event.description?.substring(0, 100)}...
              </p>
            </div>
          </div>
        ))}
      </div>

      <footer className="public-event-footer">
        <div className="footer-content">
          <p>© {currentYear} Tickify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default EventListingPage;
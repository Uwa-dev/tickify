import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUp } from 'lucide-react';
import '../../pages/Events/viewEvents.css';

const Details = ({ event }) => {
    const [contentOpen, setContentOpen] = React.useState(false);
    const [salesOpen, setSalesOpen] = React.useState(false);

    if (!event) return null;

    return (
        <>
            <div className="event-details">
                <h1>{event.eventName}</h1>
                <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Description:</strong> {event.description}</p>
            </div>

            <div className='event-links'>
                <Link to={`/events/details/${event._id}`} className='event-edit-link'>
                    Event Details
                </Link>

                <div className={`event-dropdown ${contentOpen ? 'active' : ''}`}>
                    <button
                        onClick={() => setContentOpen(!contentOpen)}
                        className="event-dropdown-button"
                    >
                        Tickets
                        {contentOpen ? (
                            <ChevronUp className="dropdown-icon" />
                        ) : (
                            <ChevronDownIcon className="dropdown-icon" />
                        )}
                    </button>
                    <div className="event-dropdown-content">
                        
                        <Link to={`/events/promo-code/${event._id}`} className="event-dropdown-link">
                            Add a Promo code
                        </Link>
                        <Link to={`/events/ticket/${event._id}`} className="event-dropdown-link">
                            Edit Tickets
                        </Link>
                    </div>
                </div>

                <div className={`event-dropdown ${salesOpen ? 'active' : ''}`}>
                    <button
                        onClick={() => setSalesOpen(!salesOpen)}
                        className='event-dropdown-button'
                    >
                        Sales
                        {salesOpen ? (
                            <ChevronUp className="event-dropdown-icon" />
                        ) : (
                            <ChevronDownIcon className="dropdown-icon" />
                        )}
                    </button>
                    {salesOpen && (
                        <div className="event-dropdown-content">
                            <Link
                                // to="/events/sales/:eventId"
                                to={`/events/sales/${event._id}`} 
                                className="event-dropdown-link"
                            >
                                Ticket Sales Summary
                            </Link>
                            <Link
                                to={`/events/payout/${event._id}`}
                                className="event-dropdown-link"
                            >
                                Payout Summary
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Details;




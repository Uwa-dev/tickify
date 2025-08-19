import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import {toast} from 'react-toastify';
import { ChevronDownIcon, ChevronUp, CalendarDays, MapPin, ScrollText, ToggleRight, ToggleLeft, Link2, Copy} from 'lucide-react';
import './details.css';

const Details = ({ event }) => {
    const [contentOpen, setContentOpen] = React.useState(false);
    const [salesOpen, setSalesOpen] = React.useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleCopy = () => {
        // Fallback to execCommand for better compatibility within the iframe
        const el = document.createElement('textarea');
        el.value = `http://localhost:5173/${event.customTicketUrl}`;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        toast.success("Link copied to clipboard!");
    };

    if (!event) return null;

    return (
        <>
            <div className="event-details">
                <h1>{event.eventName}</h1>
                <p><strong><CalendarDays size={20}/></strong> {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p><strong><MapPin size={20}/></strong> {event.location}</p>
                <p><strong><ScrollText size={20}/></strong> {event.description}</p>
                <div 
                    className='copy-link-container'
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <p className="link-text">
                    <Link2 size={20} className='link-icon'/>
                    <Link
                        to={`http://localhost:5173/${event.customTicketUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-url"
                    >
                        {`http://localhost:5173/${event.customTicketUrl}`}
                    </Link>
                    </p>
                    
                    <div 
                    className='copy-icon-wrapper'
                    style={{ opacity: isHovered ? 1 : 0 }}
                    >
                    <Copy 
                        size={15} 
                        className="copy-icon" 
                        onClick={handleCopy} 
                    />
                    </div>
                </div>
                <p><strong><ToggleRight size={30}/></strong> This event is published</p>
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




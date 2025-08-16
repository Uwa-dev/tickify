import React from 'react';
import {Link} from 'react-router-dom';
import '../Public/EventListingPage/listingPage.css'
import Logo from '../../assets/Tickify.png';
import {CalendarX2} from "lucide-react";

const NotFound = () => {
  return (
    <div className="public-container">
        <div className='no-event-container'>
            <CalendarX2 size={50}/>
            <h1>Event Not Found.</h1>
            <Link className='events-link' to="/events/listing">View Other Events</Link>
                
        </div>
    </div>
  )
}

export default NotFound
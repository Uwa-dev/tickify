import React, { useState, useEffect, useRef } from 'react';
import './details.css';
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById, updateEvent } from '../../../services/eventApi';
import store from '../../../util/store';
import { toast } from 'react-toastify';
import Details from '../../../components/reuse/Details/Details';
import Load from '../../../components/reuse/Load';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [socialMediaHandles, setSocialMediaHandles] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });

  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    customURL: '',
    eventCategory: '',
    eventImage: ''
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await getEventById(eventId);
        setEvent(data);
        setImage(data.eventImage || null);

        if(data) {
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);

          // Format date and time for input fields
          const formatDate = (date) => {
            return date.toISOString().split('T')[0];
          };

          const formatTime = (date) => {
            return date.toTimeString().slice(0, 5);
          };

          setFormData({
            eventName: data.eventName || '',
            description: data.description || '',
            location: data.location || '',
            startDate: formatDate(startDate),
            startTime: formatTime(startDate),
            endDate: formatDate(endDate),
            endTime: formatTime(endDate),
            customURL: data.customTicketUrl || '',
            eventCategory: data.eventCategory || '',
            eventImage: data.eventImage || ''
          });

          if (data.socialMediaLinks) {
            setSocialMediaHandles({
              facebook: data.socialMediaLinks.facebook || '',
              twitter: data.socialMediaLinks.twitter || '',
              instagram: data.socialMediaLinks.instagram || '',
              linkedin: data.socialMediaLinks.linkedin || ''
            });
          }

          if (data.eventImage) {
            setImage(data.eventImage);
          }
        }
      } catch (error) {
        toast.error("Failed to fetch event");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (image && containerRef.current) {
      const imageUrl = typeof image === 'string' ? image : URL.createObjectURL(image);
      containerRef.current.style.backgroundImage = `url(${imageUrl})`;
      
      // Cleanup for object URLs
      return () => {
        if (typeof image !== 'string') {
          URL.revokeObjectURL(imageUrl);
        }
      };
    } else if (containerRef.current) {
      containerRef.current.style.backgroundImage = 'none';
    }
  }, [image]);

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSocialInputChange = (e) => {
    const { name, value } = e.target;
    setSocialMediaHandles(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine date and time strings and create Date objects
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00Z`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00Z`);

    // Validate dates
    if (endDateTime <= startDateTime) {
      toast.error(`End date must be after start date. 
        Start: ${startDateTime.toLocaleString()}
        End: ${endDateTime.toLocaleString()}`);
      return;
    }

    setIsUpdating(true);
    
    try {
      const { user } = store.getState().user;
      const token = localStorage.getItem('token');

      let userId;
      if (user?._id) {
        userId = user._id;
      } else if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
        } catch (e) {
          console.error('Failed to parse JWT:', e);
        }
      }

      if (!userId) {
        toast.error("Cannot verify your identity");
        return;
      }

      if (String(userId) !== String(event.organizer)) {
        toast.error("Only the event organizer can update this event");
        return;
      }

      // Prepare the data to send
      const updateData = {
        eventName: formData.eventName,
        description: formData.description,
        location: formData.location,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        customTicketUrl: formData.customURL,
        eventCategory: formData.eventCategory,
        socialMediaLinks: socialMediaHandles
      };

      // Create FormData if there's an image to upload
      let dataToSend;
      if (image && typeof image !== 'string') {
        dataToSend = new FormData();
        dataToSend.append('eventImage', image);
        Object.keys(updateData).forEach(key => {
          dataToSend.append(key, updateData[key]);
        });
      } else {
        dataToSend = updateData;
      }

      // Call the update API
      const updatedEvent = await updateEvent(eventId, dataToSend);
      
      // Update local state with the response
      setEvent(updatedEvent);
      toast.success("Event updated successfully");
      
    } catch (error) {
      toast.error(error.message || "Failed to update event");
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading-container">
      <Load />
    </div>;
  }

  if (!event) {
    return <div className="error-container">
      <TriangleAlert size={130}/>
     <p> No event found</p>
    </div>;
  }

  return (
    <div className='event-details-container' ref={containerRef}>
      <div className="content-overlay">
        <div className='back-container' onClick={() => navigate(-1)}>
          <ArrowLeft />
          <h4>Back</h4>
        </div>

        <Details event={event} />

        <div className='edit-event-container'>
          <h3 className='form-title'>Edit Event</h3>

          <form className="event-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="eventName" className="create-event-label">
                Event Name: 
              </label>
              <input
                type="text"
                id="eventName"
                placeholder="Enter event name"
                className='form-input'
                value={formData.eventName}
                onChange={handleChange}
              />
            </div>

            <div className="form-description">
              <label htmlFor="description" className="create-event-label ">
                Description:
              </label>
              <textarea
                id="description"
                className="text-description"
                placeholder="Describe your event........"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="create-event-label">
                Location:
              </label>
              <input
                type="text"
                id="location"
                placeholder="Enter location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="create-event-label">
                Event Start Date:
              </label>
              <input
                  type="date"
                  id="startDate"
                  className="form-input-date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="create-event-label">
                Event Start Time:
              </label>
              <input
                type="time"
                id="startTime"
                className="form-input-date"
                value={formData.startTime}
                onChange={handleChange}
                required
              /> 
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="create-event-label">
                Event End Date:
              </label>
              <input
                  type="date"
                  id="endDate"
                  className="form-input-date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="create-event-label">
                Event End Time:
              </label>  
              <input
                type="time"
                id="endTime"
                className="form-input-date"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customURL" className="create-event-label">
                Use custom URL:
              </label>
              <input
                type="text"
                id="customURL"
                placeholder="Enter custom URL"
                className="form-input"
                value={formData.customURL}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventCategory" className="create-event-label">
                Event Category:
              </label>
              <select
                id="eventCategory"
                className="form-input form-select"
                value={formData.eventCategory}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                <option value="Art & Culture">Art & Culture</option>
                <option value="Career, Investment & Business">Career, Investment & Business</option>
                <option value="Charity & Aid">Charity & Aid</option>
                <option value="Children & Youth">Children & Youth</option>
                <option value="Fashion & Design">Fashion & Design</option>
                <option value="Food & Drink">Food & Drink</option>
                <option value="Government & Community">Government & Community</option>
                <option value="Media & Film">Media & Film</option>
                <option value="Music & Performances">Music & Performances</option>
                <option value="Schools & Education">Schools & Education</option>
                <option value="StartUp & Small Business">StartUp & Small Business</option>
                <option value="Sports & Fitness">Sports & Fitness</option>
                <option value="Spirituality & Religion">Spirituality & Religion</option>
                <option value="Technology & Science">Technology & Science</option>
              </select>
            </div>

            <div className="form-group">
              <div className="form-image">
                {image ? (
                  typeof image === 'string' ? (
                    <img
                      src={image}
                      alt="Event Flier"
                      className="image-preview"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Event Flier Preview"
                      className="image-preview"
                    />
                  )
                ) : (
                  <div className="image-upload-placeholder">
                    <svg 
                      className="placeholder-icon" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="placeholder-text">Drag & Drop or Click to Upload</p>
                    <input
                      type="file"
                      id="eventImage"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input-overlay"
                    />
                  </div>
                )}
                {image && (
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => setImage(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {Object.entries(socialMediaHandles).map(([key, value]) => (
              <div className="form-group" key={key}>
                <label htmlFor={key} className="create-event-label">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="text"
                  id={key}
                  name={key}
                  className="form-input"
                  placeholder={`Enter ${key} URL`}
                  value={value}
                  onChange={handleSocialInputChange}
                />
              </div>
            ))}
            
            <div className="create-event-btns">
              <button 
                type="submit" 
                className="submit-button"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
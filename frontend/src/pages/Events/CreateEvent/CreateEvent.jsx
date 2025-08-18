
import React, { useState, useEffect } from "react";
// import "../event.css";
import "./create.css";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../../services/eventApi";
import { toast } from "react-toastify";
import { meAccount } from "../../../services/authApi";

// Helper function to generate time options for the dropdowns
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {

    const formattedHour = String(hour).padStart(2, '0');
    const timeValue = `${formattedHour}:00`;
      options.push(
        <option key={timeValue} value={timeValue}>
          {timeValue}
        </option>
      );
  }
  return options;
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [customURL, setCustomURL] = useState("tickify/events/");
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    eventLocation: "",
    eventStartDate: "",
    eventStartTime: "",
    eventEndDate: "",
    eventEndTime: "",
    eventCategory: "",
  });
  const [socialMediaHandles, setSocialMediaHandles] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  });
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(0);
  const [image, setImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await meAccount();
        
        // Check different possible response structures
        const user = response.data?.user || response.data || response?.user;
        
        if (user) {
          setUserData(user);
        } else {
          console.warn("Unexpected user data structure:", response);
          setUserData({}); // Set empty object to prevent errors
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Couldn't load user information");
        setUserData({}); // Set empty object to prevent errors
      }
    };

    fetchUserData();
  }, []);

  // Safe display name function
  const getDisplayName = () => {
    if (!userData) return "there"; // Loading state
    
    // Check if username is default format (user + numbers)
    const isDefaultUsername = userData.username && /^user\d+$/.test(userData.username);
    
    // Return the most appropriate name
    return userData.firstName || 
    (!isDefaultUsername && userData.username) || 
    "there";
  };



  const handleSocialInputChange = (e) => {
    const { name, value } = e.target;
    setSocialMediaHandles((prevHandles) => ({
      ...prevHandles,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };



  const handleURLChange = (e) => {
    const value = e.target.value;
    if (!value.startsWith("tickify/events/")) {
      setCustomURL("tickify.com/events/");
    } else {
      setCustomURL(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    const startDateTime =
      formData.eventStartDate && formData.eventStartTime
        ? new Date(`${formData.eventStartDate}T${formData.eventStartTime}`)
        : null;
    const endDateTime =
      formData.eventEndDate && formData.eventEndTime
        ? new Date(`${formData.eventEndDate}T${formData.eventEndTime}`)
        : null;

    // Validate all fields
    if (!formData.eventName.trim())
      newErrors.eventName = "Event name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.eventLocation.trim())
      newErrors.eventLocation = "Location is required";
    if (!formData.eventStartDate)
      newErrors.eventStartDate = "Start date is required";
    if (!formData.eventStartTime)
      newErrors.eventStartTime = "Start time is required";
    if (!formData.eventEndDate) newErrors.eventEndDate = "End date is required";
    if (!formData.eventEndTime) newErrors.eventEndTime = "End time is required";
    if (!formData.eventCategory)
      newErrors.eventCategory = "Category is required";

    // Additional date validation
    if (startDateTime && startDateTime <= today) {
      newErrors.eventStartDate = "Start date must be a future date and time";
    }

    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      newErrors.eventEndDate =
        "End date and time must be later than start date and time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const isValid = validateForm();
    if (isValid) {
      setPage(1);
    }
    // Errors will be displayed automatically through the errors state
  };

  // Check if all required fields are filled (for button disable)
  const isFormValid = () => {
    return (
      formData.eventName.trim() &&
      formData.description.trim() &&
      formData.eventLocation.trim() &&
      formData.eventStartDate &&
      formData.eventStartTime &&
      formData.eventEndDate &&
      formData.eventEndTime &&
      formData.eventCategory
    );
  };

  const saveDataToBackend = async () => {
    const newForm = new FormData();
    newForm.append("eventName", formData.eventName);
    newForm.append("description", formData.description);
    newForm.append("location", formData.eventLocation);
    newForm.append("customURL", customURL);
    newForm.append("eventStartDate", formData.eventStartDate);
    newForm.append("eventStartTime", formData.eventStartTime);
    newForm.append("eventEndDate", formData.eventEndDate);
    newForm.append("eventEndTime", formData.eventEndTime);
    newForm.append("eventCategory", formData.eventCategory);
    newForm.append("eventImage", image);

    // Only append social media fields if they have values
    if (socialMediaHandles.facebook) newForm.append("facebook", socialMediaHandles.facebook);
    if (socialMediaHandles.twitter) newForm.append("twitter", socialMediaHandles.twitter);
    if (socialMediaHandles.instagram) newForm.append("instagram", socialMediaHandles.instagram);
    if (socialMediaHandles.linkedin) newForm.append("linkedin", socialMediaHandles.linkedin);


    try {
      const response = await createEvent(newForm);
      
      if (response.data.success) {
        return response.data;
      } else {
        toast.error(response.data.error || "Failed to create event");
        return null;
      }
    } catch (error) {
      console.error("Failed to save data:", error);
      return false;
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please upload an image to proceed.");
      return;
    }

    setIsLoading(true);

    const result = await saveDataToBackend();
   
    if (result) {
      const eventId = result.event._id;
      navigate(`/events/${eventId}/create-ticket`);
    } else {
      toast.error("Failed to save event. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="event-create-container">
      <div className="create-form-container">
        <h3 className="form-title">
          Hey {getDisplayName()}, let's set you up for an amazing event
        </h3>
        <form className="event-form" onSubmit={handleContinue}>
          {page == 0 && (
            <div>
              <div className="form-group">
                <label htmlFor="eventName" className="create-event-label">
                  Event Name
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="eventName"
                  placeholder="Enter event name"
                  className={`form-input ${errors.eventName ? "error" : ""}`}
                  value={formData.eventName}
                  onChange={handleChange}
                />
                {errors.eventName && (
                  <span className="error-message">{errors.eventName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="create-event-label">
                  Description
                  <span className="required-asterisk">*</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  className="text-description"
                  placeholder="Describe your event........"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
                {errors.description && (
                  <span className="error-message">{errors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="eventLocation" className="create-event-label">
                  Location
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="eventLocation"
                  placeholder="Enter location"
                  className="form-input"
                  value={formData.eventLocation}
                  onChange={handleChange}
                  required
                />
                {errors.eventLocation && (
                  <span className="error-message">{errors.eventLocation}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="eventStartDate" className="create-event-label">
                  Event Start Date and Time
                  <span className="required-asterisk">*</span>
                </label>
                <div className="form-date-input">
                  <input
                    type="date"
                    id="eventStartDate"
                    className="form-input-date"
                    value={formData.eventStartDate}
                    onChange={handleChange}
                    required
                  />
                  <select
                    id="eventStartTime"
                    className="form-input-date"
                    value={formData.eventStartTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">00:00</option>
                    {generateTimeOptions()}
                  </select>
                </div>
                {errors.eventStartDate && (
                  <span className="error-message">{errors.eventStartDate}</span>
                )}
                {errors.eventStartTime && (
                  <span className="error-message">{errors.eventStartTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="eventEndDate" className="create-event-label">
                  Event End Date and Time
                  <span className="required-asterisk">*</span>
                </label>
                <div className="form-date-input">
                  <input
                    type="date"
                    id="eventEndDate"
                    className="form-input-date"
                    value={formData.eventEndDate}
                    onChange={handleChange}
                    required
                  />
                  <select
                    id="eventEndTime"
                    className="form-input-date"
                    value={formData.eventEndTime}
                    onChange={handleChange}
                    required
                  >
                    <option value="">00:00</option>
                    {generateTimeOptions()}
                  </select>
                </div>
                {errors.eventEndDate && (
                  <span className="error-message">{errors.eventEndDate}</span>
                )}
                {errors.eventEndTime && (
                  <span className="error-message">{errors.eventEndTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customURL" className="create-event-label">
                  Use custom URL
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  id="customURL"
                  placeholder="Enter custom URL"
                  className="form-input"
                  value={customURL}
                  onChange={handleURLChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventCategory" className="create-event-label">
                  Event Category
                  <span className="required-asterisk">*</span>
                </label>
                <select
                  name="eventCategory"
                  id="eventCategory"
                  className="form-input form-select"
                  value={formData.eventCategory}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Art & Culture">Art & Culture</option>
                  <option value="Career, Investment & Business">
                    Career, Investment & Business
                  </option>
                  <option value="Charity & Aid">Charity & Aid</option>
                  <option value="Children & Youth">Children & Youth</option>
                  <option value="Fashion & Design">Fashion & Design</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Government & Community">
                    Government & Community
                  </option>
                  <option value="Media & Film">Media & Film</option>
                  <option value="Music & Performances">
                    Music & Performances
                  </option>
                  <option value="Schools & Education">
                    Schools & Education
                  </option>
                  <option value="StartUp & Small Business">
                    StartUp & Small Business
                  </option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Spirituality & Religion">
                    Spirituality & Religion
                  </option>
                  <option value="Technology & Science">
                    Technology & Science
                  </option>
                </select>
                {errors.eventCategory && (
                  <span className="error-message">{errors.eventCategory}</span>
                )}
              </div>

              <div className="create-event-btns">
                <button
                  type="button"
                  className="submit-button cancel-event-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="submit-button continue-event-btn"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {page == 1 && (
            <div>
              <div className="form-group img">
                <label htmlFor="eventImage" className="create-event-label">
                  Event Image
                </label>
                <div className="form-image">
                  {image ? (
                    <>
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Event Flier Preview"
                        className="image-preview"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setImage(null)}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    // <>
                    //   <input
                    //     type="file"
                    //     id="eventImage"
                    //     accept="image/*"
                    //     onChange={handleImageUpload}
                    //   />
                    // </>
                    <div className="placeholder-container">
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
                </div>
                {/* <p className="placeholder-text">
                  Click to upload a hand flier
                </p> */}
              </div>

              {Object.entries(socialMediaHandles).map(([key, value]) => (
                <div className="form-group" key={key}>
                  <label htmlFor={key} className="create-event-label">
                    {key.charAt(0).toUpperCase() + key.slice(1)} (Optional)
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
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {/* Continue */}
                  {isLoading ? "Loading..." : "Continue"}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
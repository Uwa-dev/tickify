import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { meAccount, updateUserProfile } from '../../services/authApi';
import '../Events/event.css';
import './profile.css';

const Personal = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await meAccount();
        
        if (response.success) {
          setUserData({
            firstName: response.user.firstName || '',
            middleName: response.user.middleName || '',
            lastName: response.user.lastName || '',
            username: response.user.username || '',
            phone: response.user.phone || '',
            email: response.user.email || ''
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const response = await updateUserProfile(userData);
      
      if (response.success) {
        toast.success(response.message || 'Profile updated successfully!');
        // Update local state with any changes from server
        setUserData(prev => ({
          ...prev,
          username: response.user.username || prev.username,
          email: response.user.email || prev.email
        }));
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className='event-create-container'>
        <div className='create-form-container'>
          <h3 className='form-title'>Loading your profile...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className='event-create-container'>
      <div className='create-form-container'>
        <h3 className='form-title'>
          Hey {userData.firstName || 'User'}, is your information correct?
        </h3>
        <form className="account-event-form profile-form" onSubmit={handleSubmit}>
          <div className='profile-form-grid'>
            {[
              { label: "First Name", name: "firstName", required: true },
              { label: "Middle Name", name: "middleName", required: false },
              { label: "Last Name", name: "lastName", required: true },
              { label: "Username", name: "username", required: true },
              { label: "Phone Number", name: "phone", required: false },
              { label: "Email", name: "email", required: true }
            ].map(({ label, name, required }) => (
              <div className="account-form-group" key={name}>
                <label htmlFor={name} className="create-event-label">
                  {label}
                  {required && <span className="required-asterisk">*</span>}
                </label>
                <input
                  type={name === 'email' ? 'email' : 'text'}
                  id={name}
                  name={name}
                  className="form-input"
                  placeholder={`Enter your ${label.toLowerCase()}`}
                  value={userData[name]}
                  onChange={handleChange}
                  required={required}
                  disabled={name === 'email' && isUpdating} // Often emails require special verification
                />
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            className="submit-button continue-event-btn"
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Info'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Personal;
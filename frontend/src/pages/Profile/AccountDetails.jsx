import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { meAccount, updateAccountDetails } from '../../services/authApi';
import '../Events/event.css';
import './profile.css';

const AccountDetails = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountName: '',
    bankName: '',
    accountNumber: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data and account details
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await meAccount();
        
        if (response.success) {
          setUserData({
            firstName: response.user.firstName || '',
            lastName: response.user.lastName || ''
          });
          
          // Initialize account details with existing data or empty strings
          setAccountDetails({
            accountName: response.user.accountDetails?.accountName || '',
            bankName: response.user.accountDetails?.bankName || '',
            accountNumber: response.user.accountDetails?.accountNumber || ''
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccountDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Client-side validation
      if (!accountDetails.accountName || !accountDetails.bankName || !accountDetails.accountNumber) {
        throw new Error('All fields are required');
      }

      if (!/^[0-9]{10,}$/i.test(accountDetails.accountNumber)) {
        throw new Error('Account number must be at least 10 digits');
      }

      const response = await updateAccountDetails({
        accountDetails: accountDetails
      });
      
      if (response.success) {
        toast.success(response.message || 'Account details updated successfully!');
      }
    } catch (err) {
      toast.error(err.message || "Failed to update account details");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='event-create-container'>
        <div className='create-form-container'>
          <h3 className='form-title'>Loading account details...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className='event-create-container'>
      <div className='create-form-container'>
        <h3 className='form-title'>
          Hey {userData.firstName || 'User'}, are these details correct?
        </h3>
        <form className="account-event-form profile-form" onSubmit={handleSubmit}>
          <div className='profile-form-grid'>
            <div className="account-form-group">
              <label htmlFor="accountName" className="create-event-label">Account Name</label>
              <input 
                type="text" 
                id="accountName" 
                name="accountName"
                placeholder="Enter account name (must match your full name)" 
                className="form-input"
                value={accountDetails.accountName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="account-form-group">
              <label htmlFor="bankName" className="create-event-label">Bank Name</label>
              <input 
                type="text" 
                id="bankName" 
                name="bankName"
                placeholder="Enter bank name" 
                className="form-input"
                value={accountDetails.bankName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="account-form-group">
              <label htmlFor="accountNumber" className="create-event-label">Account Number</label>
              <input 
                type="text" 
                id="accountNumber" 
                name="accountNumber"
                placeholder="Enter 10-digit account number" 
                className="form-input"
                value={accountDetails.accountNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{10,}"
                title="Account number must be at least 10 digits"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button continue-event-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Account Details'}
          </button>
        </form>
        <p className="account-note">
          Note: The account name must exactly match your registered name: {userData.firstName} {userData.lastName}
        </p>
      </div>
    </div>
  );
};

export default AccountDetails;
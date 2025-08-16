import React, { useState, useEffect } from 'react';
// import './viewEvents.css';
import { ArrowLeft, ChevronDownIcon, ChevronUp } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById } from '../../services/authApi'; // You'll need to create this API function
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const UsersDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

   useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getUserById(id);
        setUser(data);
        setError(null);
      } catch (err) {
        setError('Failed to load user data');
        toast.error('Failed to fetch user details');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Only fetch if ID exists
      fetchUser();
    } else {
      setError('Invalid user ID');
      setLoading(false);
    }
  }, [id]);

  if (!user) return <p>Loading user details...</p>;

  return (
    <div className='allevents-container'>
      <div className='back-container' onClick={() => navigate(-1)}>
        <ArrowLeft />
        <h4>Back</h4>
      </div>

      <div className="user-details">
        <h1>{user.firstName} {user.middleName && `${user.middleName} `}{user.lastName}</h1>
        
        <div className="user-info-section">
          <h3>Basic Information</h3>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Admin Status:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
        </div>

        <div className="dropdown">
          <button
            onClick={() => setAccountOpen(!accountOpen)}
            className={`dropdown-button ${accountOpen ? "active" : ""}`}
          >
            Account Details
            {accountOpen ? (
              <ChevronUp className="dropdown-icon" />
            ) : (
              <ChevronDownIcon className="dropdown-icon" />
            )}
          </button>
          {accountOpen && (
            <div className="dropdown-content account-details">
              {user.accountDetails ? (
                <>
                  <p><strong>Account Name:</strong> {user.accountDetails.accountName || 'Not provided'}</p>
                  <p><strong>Account Number:</strong> {user.accountDetails.accountNumber || 'Not provided'}</p>
                  <p><strong>Bank Name:</strong> {user.accountDetails.bankName || 'Not provided'}</p>
                </>
              ) : (
                <p>No account details available</p>
              )}
            </div>
          )}
        </div>

        {user.isAdmin && (
          <div className="dropdown">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={`dropdown-button ${adminOpen ? "active" : ""}`}
            >
              Admin Actions
              {adminOpen ? (
                <ChevronUp className="dropdown-icon" />
              ) : (
                <ChevronDownIcon className="dropdown-icon" />
              )}
            </button>
            {adminOpen && (
              <div className="dropdown-content">
                <Link
                  to={`/users/${id}/edit`}
                  className="dropdown-link"
                >
                  Edit User
                </Link>
                <Link
                  to={`/users/${id}/permissions`}
                  className="dropdown-link"
                >
                  Manage Permissions
                </Link>
                <Link
                  to={`/users/${id}/activity`}
                  className="dropdown-link"
                >
                  View Activity Log
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersDetails;
import React, { useState, useEffect, } from 'react';
import { useParams } from 'react-router-dom';
import Logo from "../../../assets/Tickify.png";
import { checkIn } from '../../../services/publicApi';

const CheckIn = () => {
  // Use the useParams hook to get the eventId from the URL.
  const { eventId } = useParams();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to clear the message after a few seconds.
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 10000); 

      return () => clearTimeout(timer);
    }
  }, [message]); 

  // The asynchronous function to handle the form submission.
  const handleCheckIn = async (e) => {
    e.preventDefault();

    // Do not proceed if the email field is empty or a request is in progress.
    if (!email.trim() || isLoading) {
      return;
    }

    // Set loading state and clear previous messages.
    setIsLoading(true);
    setMessage('');

    try {
        // Call the checkIn controller function with the eventId and email.
        const result = await checkIn(eventId, email);
        
        // If the API call is successful, set a success message.
        setMessage('You have successfully checked into the event!');
        setMessageColor('var(--color)');
        setEmail(''); // Clear the email input on success
    } catch (error) {
        // If there's an error, set a failure message.
        setMessage(error.message || 'Please enter the email used to pay for the ticket.');
        setMessageColor('var(--accent-color)');
    } finally {
        // Always set loading state to false.
        setIsLoading(false);
    }
  };

  return (
    <div className="check-in-container">
      <style>{`

        .logo-container {
            height: 5rem;
            width: 10rem;
            margin-bottom: 1.5rem;
        }

        .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .check-in-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background-color: var(--pink-background);
          font-family: 'Inter', sans-serif;
        }

        .check-in-box {
          border-radius: 1rem;
          width: 100%;
          max-width: 25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        form {
            background-color: #ffffff;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            width: 100%;
        }

        .check-in-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--background-color);
          margin-bottom: 1rem;
        }

        .check-in-input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 2px solid var(--accent-color);
          background-color: white;
          color: #333;
          font-size: 1rem;
          margin-bottom: 1rem;
          outline: none;
          transition: border-color 0.3s ease-in-out;
        }

        .check-in-input:focus {
          border-color: var(--color);
        }

        .check-in-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: none;
          background-color: var(--color);
          color: var(--pink-background);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
        }

        .check-in-button:hover {
          background-color: var(--accent-color);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .check-in-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
            transform: translateY(0);
            box-shadow: none;
        }

        .check-in-message {
          margin-top: 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          padding: 1rem;
          border-radius: 0.5rem;
          width: 100%;
          text-align: center;
          background-color: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <div className="check-in-box">
        <div className='logo-container'>
            <img src={Logo} alt="Tickify Logo" />
        </div>
        <h1 className='check-in-title'>Check-in</h1>
        <form onSubmit={handleCheckIn}>
            <input
            type="email"
            className="check-in-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            />
            <button
            className="check-in-button"
            type="submit"
            disabled={isLoading}
            >
                {isLoading ? 'Checking In...' : 'Check In'}
            </button>
        </form>

        {/* The message container is only rendered if a message exists */}
        {message && (
          <div
            className="check-in-message"
            style={{ color: messageColor }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
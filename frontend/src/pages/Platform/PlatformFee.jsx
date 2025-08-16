import React, { useState, useEffect} from 'react';
import { Percent, CheckCircle, XCircle } from 'lucide-react';
import { getPlatformFee, updatePlatformFee } from '../../services/adminApi';
import Load from '../../components/reuse/Load'

// Custom CSS for this component
const styles = `
  .platform-fee-page {
    min-height: 100vh;
    background-color: #ffffff;
    color: #111827;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
  }

  .grid-container {
    width: 100%;
    max-width: 64rem;
    display: grid;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .card {
    background-color: var(--background-color);
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    transition: transform 0.3s ease-in-out;
    transform: translateY(20px);
    opacity: 0;
    animation: fadeInSlideUp 0.5s forwards;
  }

  .card:hover {
    transform: scale(1.02);
  }
  
  .card.calculator-card {
    animation-delay: 0.2s;
  }

  @keyframes fadeInSlideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .card-header {
    font-size: 1.875rem;
    font-weight: 800;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--accent-color);
    color: var(--dark-color);
  }

  .card-description {
    color: var(--color);
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--dark-color);
    margin-bottom: 0.25rem;
  }

  .current-fee-display {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
  }

  .current-fee-value {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color);
  }
  
  .current-fee-note {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    color: var(--dark-color);
  }
  
  .input-container {
    position: relative;
    margin-top: 0.25rem;
  }

  .input-field {
    display: block;
    width: 100%;
    border-radius: 0.5rem;
    border: 1px solid var(--accent-color);
    background-color: #ffffff;
    color: var(--background-color);
    padding: 0.75rem 1rem;
    padding-right: 3rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--light-hover);
    box-shadow: 0 0 0 3px rgba(251, 224, 107, 0.5);
  }

  .input-icon {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    transform: translateY(-50%);
    color: var(--accent-color);
  }

  .save-button {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    color: var(--background-color);
    background-color: var(--color);
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
  }

  .save-button:hover {
    background-color: var(--dark-color);
  }

  .save-button:disabled {
    background-color: var(--accent-color);
    cursor: not-allowed;
  }

  .message-container {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0;
    transform: translateY(10px);
    animation: fadeInSlideUpMessage 0.3s forwards;
  }

  .message-container.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  .message-container.error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  @keyframes fadeInSlideUpMessage {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message-icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
  }

  .calculator-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--accent-color);
  }

  .calculator-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--dark-color);
  }
  
  .calculator-item.total {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color);
    padding-top: 0.5rem;
    border-top: 1px dashed var(--accent-color);
  }
  
  .calculator-item .value {
    color: #ffffff;
  }
  
  .calculator-item .fee-value {
    color: #ef4444;
  }
`;

const PlatformFee = () => {
  const [newFee, setNewFee] = useState('');
  const [currentFee, setCurrentFee] = useState(null); // Initialize as null to handle loading state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New state for initial data fetch
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // State for the fee calculator
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState('');

  // --- useEffect hook to fetch the initial platform fee ---
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const response = await getPlatformFee();
        // Assuming the API returns an object with a 'feePercentage' property
        if (response && response.feePercentage !== undefined) {
          setCurrentFee(response.feePercentage);
        } else {
          // Handle case where no fee is set yet, fall back to a default
          setCurrentFee(5.0);
        }
      } catch (error) {
        console.error('Failed to fetch platform fee:', error);
        setMessage('Failed to load the current platform fee.');
        setIsError(true);
        // Fallback to a default if the fetch fails
        setCurrentFee(5.0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, []); // Empty dependency array means this runs only once on mount

  // --- Function to handle saving the new fee ---
  const handleSaveFee = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const feeValue = parseFloat(newFee);
    // Basic validation
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      setMessage('Please enter a valid percentage between 0 and 100.');
      setIsError(true);
      return;
    }

    setIsSaving(true);
    try {
      // Make the API call to update the fee
      await updatePlatformFee(feeValue);
      // On success, update the current fee in the state and clear the input
      setCurrentFee(feeValue);
      setMessage(`Platform fee successfully updated to ${feeValue.toFixed(2)}%.`);
      setIsError(false);
      setNewFee('');
    } catch (error) {
      console.error('Error updating platform fee:', error);
      setMessage('Failed to save the platform fee. Please try again.');
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate fees and totals based on currentFee
  const price = parseFloat(ticketPrice) || 0;
  const quantity = parseInt(ticketQuantity, 10) || 0;
  const subtotal = price * quantity;
  const feeAmount = subtotal * ((currentFee || 0) / 100);
  const totalRevenue = subtotal - feeAmount;

  if (isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="platform-fee-page">
          <div className="loader-container">
            <Load />
            Loading Fee Settings...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="platform-fee-page">
        <div className="grid-container">
          {/* Fee Settings Card */}
          <div className="card">
            <h2 className="card-header">
              Platform Fee Settings
            </h2>
            <p className="card-description">
              Set the percentage-based fee to be applied to all ticket sales on the platform.
            </p>

            <form onSubmit={handleSaveFee}>
              <div className="form-group">
                <label htmlFor="currentFee" className="label">
                  Current Platform Fee
                </label>
                <div className="current-fee-display">
                  <span className="current-fee-value">
                    {currentFee !== null ? `${currentFee.toFixed(2)}%` : 'N/A'}
                  </span>
                  <span className="current-fee-note">
                    (Applied to all ticket sales)
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newFee" className="label">
                  Set New Platform Fee
                </label>
                <div className="input-container">
                  <input
                    type="number"
                    name="newFee"
                    id="newFee"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 5.00"
                    required
                  />
                  <div className="input-icon">
                    <Percent className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="save-button"
                disabled={isSaving || !newFee || isNaN(parseFloat(newFee))}
              >
                {isSaving ? 'Saving...' : 'Save New Fee'}
              </button>
            </form>

            {/* Success/Error Message */}
            {message && (
              <div
                className={`message-container ${isError ? 'error' : 'success'}`}
              >
                {isError ? <XCircle className="message-icon" /> : <CheckCircle className="message-icon" />}
                {message}
              </div>
            )}
          </div>

          {/* Fee Calculator Card */}
          <div className="card calculator-card">
            <h2 className="card-header">
              Fee Calculator
            </h2>
            <p className="card-description">
              Preview how the current fee affects a ticket sale.
            </p>
            
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="ticketPrice" className="label">
                  Ticket Price (#)
                </label>
                <input
                  type="number"
                  id="ticketPrice"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ticketQuantity" className="label">
                  Ticket Quantity
                </label>
                <input
                  type="number"
                  id="ticketQuantity"
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(e.target.value)}
                  className="input-field"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="calculator-section">
              <div className="calculator-item">
                <span>Subtotal</span>
                <span className="value">#{subtotal.toFixed(2)}</span>
              </div>
              <div className="calculator-item">
                <span className="label">Platform Fee ({currentFee !== null ? `${currentFee.toFixed(2)}%` : 'N/A'})</span>
                <span className="fee-value">-#{feeAmount.toFixed(2)}</span>
              </div>
              <div className="calculator-item total">
                <span>Your Total Revenue</span>
                <span className="value">#{totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlatformFee;
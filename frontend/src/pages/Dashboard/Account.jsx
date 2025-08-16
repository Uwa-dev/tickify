import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// Import the API functions from the separate service file
import { getAllMonthlySummaries, recalculateMonthlySummaries } from '../../services/adminApi';

// Main App component to fetch and display monthly summaries
const Account = () => {
  // State for storing the summaries, loading status, and any errors
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to fetch data
  const fetchMonthlySummaries = async () => {
    setLoading(true);
    try {
      // Use the imported function to fetch data
      const response = await getAllMonthlySummaries();
      
      // Ensure data is an array before setting state
      if (response.data && Array.isArray(response.data)) {
        setSummaries(response.data);
      } else {
        // Handle cases where the API response structure is unexpected
        setError("Invalid data format received from the server.");
        toast.error("Failed to load monthly summaries due to a data format error.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load monthly summaries:", err);
      setError(err.message || "Failed to load monthly summaries");
      setLoading(false);
      toast.error(err.message || "Failed to load monthly summaries");
    }
  };

  // Helper function to handle the recalculation button click
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      // Use the imported function to trigger recalculation
      const response = await recalculateMonthlySummaries();
      // Check for success status from the API response
      if (response.status) {
        toast.success(response.message || "Monthly summaries recalculated successfully!");
        // Re-fetch the data to display the new summaries
        fetchMonthlySummaries();
      } else {
        // Handle server-side errors returned in the response body
        toast.error(response.message || "Failed to recalculate summaries.");
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to recalculate summaries.");
      setLoading(false);
    }
  };

  // Helper function to format currency for Nigerian Naira
  const formatCurrency = (amount) => {
    // Check if the amount is a valid number before formatting
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₦0.00';
    }
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // useEffect hook to fetch data when the component first mounts
  useEffect(() => {
    fetchMonthlySummaries();
  }, []); // Empty dependency array ensures this runs only once

  // Conditional rendering based on state
  if (loading) {
    return (
      <div className="container">
        <p className="loading-message">Loading monthly summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
      </div>
    );
  }
    
  if (summaries.length === 0) {
    return (
      <div className="container">
        <p className="no-data-message">No monthly summaries found.</p>
        <button onClick={handleRecalculate} className="recalculate-button">
          Recalculate Summaries
        </button>
      </div>
    );
  }

  return (
    <>
      <style jsx="true">{`
        /* Global Styles */
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }

        .container {
          padding: 0.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
        }

        .card {
          width: 100%;
          max-width: 960px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 24px;
          box-sizing: border-box;
          margin-bottom: 1rem;
        }

        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 24px;
          text-align: center;
        }

        /* Table Styles */
        .table-container {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        .table-header {
          background-color: #e5e7eb;
        }

        .table th, .table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap; /* Prevents wrapping in table cells */
        }

        .table th {
          color: #4b5563;
          font-weight: 600;
        }

        .table tr:hover {
          background-color: #f9fafb;
        }

        /* Responsive behavior for the table */
        @media (max-width: 768px) {
          .table th, .table td {
            font-size: 0.875rem;
            padding: 8px 12px;
          }
          .table thead {
            display: none;
          }
          .table, .table tbody, .table tr, .table td {
            display: block;
            width: 100%;
          }
          .table tr {
            margin-bottom: 1rem;
            border-bottom: 2px solid #e5e7eb;
          }
          .table td {
            text-align: right;
            position: relative;
            padding-left: 50%;
            white-space: nowrap;
          }
          .table td::before {
            content: attr(data-label);
            position: absolute;
            left: 12px;
            width: 45%;
            text-align: left;
            font-weight: 600;
            color: #4b5563;
          }
        }

        /* Button and Message Styles */
        .recalculate-button {
          background-color: #4CAF50; /* Green */
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s ease;
        }

        .recalculate-button:hover {
          background-color: #45a049;
        }
        
        .loading-message {
          font-size: 1.25rem;
          color: #4b5563;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .error-message {
          font-size: 1.25rem;
          color: #ef4444;
        }
        
        .no-data-message {
          font-size: 1.25rem;
          color: #6b7280;
        }

        /* Animation Keyframes */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
      <div className="container">
        <div className="card">
          <h1 className="title">Monthly Summaries</h1>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Total Tickets Sold</th>
                  <th>Total Ticket Amount</th>
                  <th>Total Revenue</th>
                  <th>Total Payouts</th>
                  <th>Balance</th>
                  
                </tr>
              </thead>
              <tbody>
                {summaries.map(summary => (
                  <tr key={summary.month}>
                    <td data-label="Month">{new Date(summary.month).toLocaleString('en-US', { month: 'long' })}</td>
                    <td data-label="Year">{new Date(summary.month).getFullYear()}</td>
                    <td data-label="Total Tickets Sold">{summary.totalTicketsSold || 0}</td>
                    <td data-label="Total Ticket Amount">{formatCurrency(summary.totalTicketAmount)}</td>
                    <td data-label="Total Revenue">{formatCurrency(summary.totalRevenue)}</td>
                    <td data-label="Total Payouts">{formatCurrency(summary.totalPayouts)}</td>
                    <td data-label="Balance">{formatCurrency(summary.balance)}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <button onClick={handleRecalculate} className="recalculate-button">
          Recalculate Summaries
        </button>
      </div>
    </>
  );
};

export default Account;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  Ticket,
  HandCoins,
  Wallet,
  BanknoteArrowDown,
  CalendarPlus
} from "lucide-react";
import { getDashboardSummary } from '../../services/dashboardApi'; // NEW: Import dashboard API
import { toast } from 'react-toastify';
import "./dashboard.css"; // Assuming dashboard-specific styles
import ScrollToTop from '../../components/reuse/ScrollToTop';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalPaidOut: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await getDashboardSummary();
        setSummary(response.data); // Assuming response.data contains the summary object
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard data.");
        console.error("Error fetching dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <main className="dashboard-main">
        <header className="dashboard-header">
          <p className="dashboard-subtitle">Loading dashboard data...</p>
        </header>
        <section className="metrics-grid">
          {/* Placeholder cards while loading */}
          {[...Array(6)].map((_, index) => (
            <div key={index} className="metric-card loading-card">
              <div className="metric-title-container">
                <h4 className="metric-title">Loading...</h4>
              </div>
              <div className="metric-value-container">
                <p className="metric-value">...</p>
                <div className="dashboard-icon-container">
                  {/* You can put a loading spinner here if desired */}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <>
    <main className="dashboard-main">

      {/* Header */}
      <header className="dashboard-header">
        <p className="dashboard-subtitle">
          Welcome back! Let's check your event performance.
        </p>
      </header>

      {/* Key Metrics */}
      <section className="metrics-grid">
        <div className="metric-card ">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Events</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{summary.totalEvents}</p>
            <div className="dashboard-icon-container">
              <CalendarRange className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Tickets Sold</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{summary.totalTicketsSold}</p>
            <div className="dashboard-icon-container">
              <Ticket className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card ">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Revenue Made</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">₦{summary.totalRevenue?.toFixed(2)}</p>
            <div className="dashboard-icon-container">
              <HandCoins className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card ">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Payout</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">₦{summary.totalPaidOut?.toFixed(2)}</p>
            <div className="dashboard-icon-container">
            <BanknoteArrowDown className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card ">
          <div className="metric-title-container">
            <h4 className="metric-title">Balance</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">₦{summary.balance?.toFixed(2)}</p>
            <div className="dashboard-icon-container">
            <Wallet className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card ">
          <div className="metric-title-container">
            <h4 className="metric-title">Upcoming Events</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{summary.upcomingEvents}</p>
            <div className="dashboard-icon-container">
            <CalendarPlus className="dashboard-icon"/>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="quick-actions">
        <Link to="/events/create" className="action-button">Create a New Event</Link>
        <Link to="/events/all" className="action-button">View All Events</Link>
      </section>
    </main>
    {/* <ScrollToTop /> */}
    </>
  );
};

export default Dashboard;


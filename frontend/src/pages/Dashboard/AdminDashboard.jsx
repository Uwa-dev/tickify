import React, { useState, useEffect } from "react";
import {
  getTotalUsers,
  ticketsSoldToday,
  ticketsSoldThisMonth,
  totalRevenueToday,
  monthlyRevenue,
  getTotalPayout,
  getAllFutureEvents
} from '../../services/adminApi';
import {
  CalendarRange,
  Ticket,
  HandCoins,
  Wallet,
  BanknoteArrowDown,
  CalendarPlus
} from "lucide-react";
import './dashboard.css'

const AdminDashboard = () => {

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    ticketsSoldToday: 0,
    ticketsSoldThisMonth: 0,
    totalRevenueToday: 0,
    monthlyRevenue: 0,
    totalPayout: 0,
    allFutureEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use Promise.all to fetch all metrics concurrently
        const [
          totalUsersRes,
          ticketsTodayRes,
          ticketsThisMonthRes,
          revenueTodayRes,
          revenueMonthlyRes,
          payoutsRes,
          futureEventsRes,
        ] = await Promise.all([
          getTotalUsers(),
          ticketsSoldToday(),
          ticketsSoldThisMonth(),
          totalRevenueToday(),
          monthlyRevenue(),
          getTotalPayout(),
          getAllFutureEvents(),
        ]);

        // Update the state with the fetched data
        setMetrics({
          totalUsers: totalUsersRes,
          ticketsSoldToday: ticketsTodayRes,
          ticketsSoldThisMonth: ticketsThisMonthRes,
          totalRevenueToday: revenueTodayRes,
          monthlyRevenue: revenueMonthlyRes,
          totalPayout: payoutsRes,
          allFutureEvents: futureEventsRes,
        });

        setLoading(false); // Set loading to false once data is fetched
      } catch (err) {
        // Log the error and set a more specific error message for the user
        console.error("Failed to fetch dashboard data:", err);
        if (err.message.includes('400')) {
          setError("API request failed: Invalid authentication. Please check your token or contact support.");
        } else {
          setError("Failed to fetch dashboard data. Please try again later.");
        }
        setLoading(false); // Set loading to false on error
      }
    };

    fetchData(); // Call the async function
  }, []); // The empty dependency array ensures this runs only once on mount

  // Conditional rendering for loading and error states
  if (loading) {
    return (
      <main className="dashboard-main">
        <div>Loading dashboard data...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-main">
        <div>{error}</div>
      </main>
    );
  }

  return (
    <main className="dashboard-main">
      {/* Header */}
      <header className="dashboard-header">
        <p className="dashboard-subtitle">
          Welcome back!
        </p>
      </header>

      {/* Key Metrics */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">All Future Events</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{metrics.allFutureEvents}</p>
            <div className="dashboard-icon-container">
              <CalendarRange className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Tickets Sold Today</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{metrics.ticketsSoldToday}</p>
            <div className="dashboard-icon-container">
              <Ticket className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Tickets Sold This Month</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{metrics.ticketsSoldThisMonth}</p>
            <div className="dashboard-icon-container">
              <Ticket className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Revenue Made This Month</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">₦{metrics.monthlyRevenue.toLocaleString()}</p>
            <div className="dashboard-icon-container">
              <HandCoins className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Revenue Made Today</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">₦{metrics.totalRevenueToday.toLocaleString()}</p>
            <div className="dashboard-icon-container">
              <Wallet className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Payout Request</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{metrics.totalPayout}</p>
            <div className="dashboard-icon-container">
              <BanknoteArrowDown className="dashboard-icon"/>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title-container">
            <h4 className="metric-title">Total Users</h4>
          </div>
          <div className="metric-value-container">
            <p className="metric-value">{metrics.totalUsers}</p>
            <div className="dashboard-icon-container">
              <CalendarPlus className="dashboard-icon"/>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
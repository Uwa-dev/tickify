import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, matchPath, Link } from "react-router-dom";
// Import the new API functions
import { getUnreadBroadcastsCount } from '../../../services/broadcastApi';
import './header.css';

function Header({ setSidebarOpen, sidebarOpen }) {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();

  // Initialize state with a default value of 0
  const [unreadCounts, setUnreadCounts] = useState({
    broadcasts: 0,
    appeals: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      // Only fetch if a user is logged in
      if (!user) return;

      try {
        if (user?.isAdmin) {
          // TODO: Implement a similar API call to fetch admin appeals count
          // This part is left for you to implement
          const mockAdminCount = 5; // Placeholder
          setUnreadCounts(prev => ({
            ...prev,
            appeals: mockAdminCount,
            total: mockAdminCount
          }));
        } else {
          // Call the new API to get the unread broadcast count for a user
          const { unreadCount } = await getUnreadBroadcastsCount();
          setUnreadCounts(prev => ({
            ...prev,
            broadcasts: unreadCount,
            total: unreadCount
          }));
        }
      } catch (err) {
        console.error('Failed to fetch unread counts:', err);
      }
    };

    fetchNotifications();

  }, [user]); // The effect now runs when the user object changes

  // Determine the notification link based on the user's role
  const getNotificationLink = () => {
    if (user?.isAdmin) {
      return "/admin/appeals";
    }
    return "/users/broadcasts";
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`;
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "A";
  };

  const routeTitles = {
    "/": "Dashboard",
    "/admin": "Admin Dashboard",
    "/events/create": "Create Event",
    "/events/all": "All Events",
    "/admin/events/all": "All Events",
    "/events/details/:eventId": "Event Details",
    "/events/:eventId/create-ticket": "Add tickets",
    "/profile/personal-information": "Personal Information",
    "/profile/account-information": "Account Information",
    "/regular": "Regular Quests",
    "/admin/users": "All Users",
    "/admin/users-details": "Users Details",
    "/qr-code": "QR Code",
    "/events/sales/:eventId": "Ticket Sales Summary",
    "/events/ticket/:eventId": "View Tickets",
    "/ticket/:ticketId": "Update Ticket",
    "/events/promo-code/:eventId": "Promo Code",
    "/events/payout/:eventId": "Payout Summary",
    "/admin/users/:id": "User Information",
    "/admin/tools/fees": "Fees",
    "/admin/tools/broadcast": "Create Broadcast",
    "/users/broadcasts": "All Broadcasts",
    "/admin/appeals": "Appeals",
    "/admin/tools/payouts": "Payouts",
    "/admin/payouts/:payoutId": "Payout Details",
    "/admin/events/:eventId": "Event Details",
    "/admin/accounts": "Accounts"
  };

  const currentTitle = Object.entries(routeTitles).find(([pattern]) =>
    matchPath({ path: pattern, end: true }, location.pathname)
  )?.[1] || "Dashboard";

  return (
    <header className="header">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className="header-content">
        <h1 className="header-title">{currentTitle}</h1>
        <div className="header-right">
          <Link to={getNotificationLink()} className="notification-btn">
            {unreadCounts.total > 0 && (
              <span className="notification-dot"></span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.73 21a2 2 0 01-3.46 0"></path>
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
            </svg>
          </Link>
          <div className="profile-dropdown">
            <div>
              <div className="profile-circle">{getInitials()}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

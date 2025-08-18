import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../util/slices/userSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDownIcon,
  ChevronUp,
  HomeIcon,
  Users,
  LogOutIcon,
  UserRound,
  QrCode,
  CalendarRange,
  Settings,
  BookOpenText
} from "lucide-react";
import "./sidebar.css";
import Logo from "../../../assets/Tickify.png";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  contentOpen,
  setContentOpen
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const isAdmin = user?.isAdmin;

  // State for dropdowns
  const [eventsOpen, setEventsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminEventsOpen, setAdminEventsOpen] = useState(false);
  const [platformToolsOpen, setPlatformToolsOpen] = useState(false); 

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""} ${isAdmin ? "admin-sidebar" : "user-sidebar"}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo-heading">
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="sidebar-header">
              <img src={Logo} alt="" className="logo" />
            </div>
          </div>

          <nav className="sidebar-nav">
            {/* Common Dashboard Link */}
            <Link
              to={isAdmin ? "/admin" : "/"}
              className={`sidebar-link ${
                location.pathname === (isAdmin ? "/admin" : "/") ? "active" : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <HomeIcon className="icon" />
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>

            {/* ADMIN-SPECIFIC NAVIGATION */}
            {isAdmin ? (
              <>
                {/* Admin Events Dropdown */}
                <div className="dropdown">
                  <button
                    onClick={() => setAdminEventsOpen(!adminEventsOpen)}
                    className={`dropdown-button ${
                      location.pathname.includes("/admin/events") ? "active" : ""
                    }`}
                  >
                    <CalendarRange className="icon"/>
                    Events
                    {adminEventsOpen ? (
                      <ChevronUp className="dropdown-icon" />
                    ) : (
                      <ChevronDownIcon className="dropdown-icon" />
                    )}
                  </button>
                  {adminEventsOpen && (
                    <div className="dropdown-content">
                      <Link
                        to="/admin/events/all"
                        className={`dropdown-link ${
                          location.pathname === "/admin/events/all" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        All Events
                      </Link>
                      <Link
                        to="/admin/events/past"
                        className={`dropdown-link ${
                          location.pathname === "/admin/events/past" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Past Events
                      </Link>
                      <Link
                        to="/admin/events/upcoming"
                        className={`dropdown-link ${
                          location.pathname === "/admin/events/upcoming" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Upcoming Events
                      </Link>
                    </div>
                  )}
                </div>

                {/* Platform Tools Dropdown */}
                <div className="dropdown">
                  <button
                    onClick={() => setPlatformToolsOpen(!platformToolsOpen)}
                    className={`dropdown-button ${
                      location.pathname.includes("/admin/tools") ? "active" : ""
                    }`}
                  >
                    <Settings className="icon"/>
                    Platform Tools
                    {platformToolsOpen ? (
                      <ChevronUp className="dropdown-icon" />
                    ) : (
                      <ChevronDownIcon className="dropdown-icon" />
                    )}
                  </button>
                  {platformToolsOpen && (
                    <div className="dropdown-content">
                      <Link
                        to="/admin/tools/fees"
                        className={`dropdown-link ${
                          location.pathname === "/admin/tools/fees" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Set Platform Fee
                      </Link>
                      <Link
                        to="/admin/tools/broadcast"
                        className={`dropdown-link ${
                          location.pathname === "/admin/tools/broadcast" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Create Broadcast
                      </Link>
                      <Link
                        to="/admin/tools/payouts"
                        className={`dropdown-link ${
                          location.pathname === "/admin/tools/payouts" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Payouts
                      </Link>
                    </div>
                  )}
                </div>

                {/* Admin Users Link (Now a standalone item again) */}
                <Link
                  to="/admin/users"
                  className={`sidebar-link ${
                    location.pathname.includes("/admin/users") ? "active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Users className="icon"/>
                  Manage Users
                </Link>
                <Link
                  to="/admin/accounts"
                  className={`sidebar-link ${
                    location.pathname.includes("/admin/users") ? "active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <BookOpenText className="icon"/>
                  Accounts
                </Link>
              </>
            ) : (
              <>
                {/* USER-SPECIFIC NAVIGATION */}
                {/* User Events Dropdown */}
                <div className="dropdown">
                  <button
                    onClick={() => setContentOpen(!contentOpen)}
                    className={`dropdown-button ${
                      location.pathname.includes("/events") && !location.pathname.includes("/events/qr-code")? "active" : ""
                    }`}
                  >
                    <CalendarRange className="icon"/>
                    Events
                    {contentOpen ? (
                      <ChevronUp className="dropdown-icon" />
                    ) : (
                      <ChevronDownIcon className="dropdown-icon" />
                    )}
                  </button>
                  {contentOpen && (
                    <div className="dropdown-content">
                      <Link
                        to="/events/create"
                        className={`dropdown-link ${
                          location.pathname === "/events/create" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Create Event
                      </Link>
                      <Link
                        to="/events/all"
                        className={`dropdown-link ${
                          location.pathname === "/events/all"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        All Events
                      </Link>
                      
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="dropdown">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`dropdown-button ${
                      location.pathname.includes("/profile") ? "active" : ""
                    }`}
                  >
                    <UserRound className="icon"/>
                    Profile
                    {profileOpen ? (
                      <ChevronUp className="dropdown-icon" />
                    ) : (
                      <ChevronDownIcon className="dropdown-icon" />
                    )}
                  </button>
                  {profileOpen && (
                    <div className="dropdown-content">
                      <Link
                        to="/profile/personal-information"
                        className={`dropdown-link ${
                          location.pathname === "/profile/personal-information" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Personal Information
                      </Link>
                      <Link
                        to="/profile/account-information"
                        className={`dropdown-link ${
                          location.pathname === "/profile/account-information" ? "active" : ""
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        Account Information
                      </Link>
                    </div>
                  )}
                </div>

                {/* Regular Guests Link */}
                <Link
                  to="/regular"
                  className={`sidebar-link ${
                    location.pathname.includes("/regular") ? "active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Users className="icon"/>
                  Regular Guests
                </Link>

                {/* QR Code Link */}
                <Link
                  to="/events/qr-code"
                  className={`sidebar-link ${
                    location.pathname.includes("/events/qr-code") ? "active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <QrCode className="icon"/>
                  QR Code
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOutIcon className="icon" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
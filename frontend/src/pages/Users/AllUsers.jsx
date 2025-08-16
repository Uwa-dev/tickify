import React, { useState, useEffect } from 'react';
import { allUsers, toggleUserBan } from '../../services/adminApi';
import { Circle, CircleOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../AdminEvents/allevents.css'; // Importing the new vanilla CSS file

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [modal, setModal] = useState({
    isOpen: false,
    userId: null,
    isBanned: null,
    username: null
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await allUsers({ page: pagination.currentPage });
      if (response.success) {
        setUsers(response.data);
        setPagination({
          currentPage: response.pagination.page,
          totalPages: response.pagination.pages
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to fetch users.");
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const openBanModal = (userId, isBanned, username) => {
    // THIS CONSOLE.LOG IS TO VERIFY THE ID IS CORRECTLY PASSED FROM THE TABLE ROW
    console.log("ID passed to modal:", userId);
    setModal({
      isOpen: true,
      userId,
      isBanned,
      username
    });
  };

  const handleToggleBan = async () => {
    const { userId, isBanned } = modal;
    
    // THIS CONSOLE.LOG IS TO VERIFY THE ID IS CORRECTLY USED IN THE API CALL
    console.log("Attempting to toggle ban for user ID:", userId);
    
    try {
      const response = await toggleUserBan(userId);
      toast.success(response.message);
      setUsers(prevUsers => prevUsers.map(user =>
        user._id === userId
          ? { ...user, isBanned: response.data.isBanned }
          : user
      ));
      setModal({ ...modal, isOpen: false }); // Close modal on success
    } catch (err) {
      toast.error(err.message || "Failed to toggle user ban status.");
      console.error("Error toggling user ban status:", err);
      setModal({ ...modal, isOpen: false }); // Also close modal on error
    }
  };


  if (loading) return <div className="loading-container">Loading users...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className='users-container'>
      <div className="card">
        <div className="card-body">
          <h1 className="users-title">All Organizers</h1>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Total Events</th>
                  <th>Total Tickets Sold</th>
                  <th>Total Sales</th>
                  <th>Total Revenue</th>
                  <th>Ban</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No organizers found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="user-link"
                        >
                          {user.username}
                        </Link>
                      </td>
                      <td>{user.totalEvents}</td>
                      <td>{user.totalTicketsSold}</td>
                      <td>₦{user.totalSales?.toFixed(2) || '0.00'}</td>
                      <td>₦{user.totalRevenue?.toFixed(2) || '0.00'}</td>
                      {/* Here we pass the correct user._id to the modal */}
                      <td onClick={() => openBanModal(user._id, user.isBanned, user.username)} className="ban-icon-cell">
                        {user.isBanned ? (
                          <CircleOff className="banned-icon clickable-icon" title="Click to Unban" />
                        ) : (
                          <Circle className="active-icon clickable-icon" title="Click to Ban" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className='pagination-btn'
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className='pagination-btn'
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {modal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <p className="modal-message">
              {modal.isBanned
                ? `Are you sure you want to UNBAN "${modal.username}"? They will regain access.`
                : `Are you sure you want to BAN "${modal.username}"? They will lose access to the platform.`
              }
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleBan}
                className={`modal-confirm-btn ${modal.isBanned ? 'unban' : 'ban'}`}
              >
                {modal.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
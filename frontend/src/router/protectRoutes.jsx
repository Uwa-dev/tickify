import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const location = useLocation();
  const isAdmin = user?.isAdmin || false;
  const path = location.pathname;

  // 1. Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Check admin access rules
  if (isAdmin && !path.startsWith('/admin')) {
    // Redirect admin users trying to access non-admin routes
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin && path.startsWith('/admin')) {
    // Redirect non-admin users trying to access admin routes
    return <Navigate to="/" replace />;
  }

  // 3. If all checks pass, render the children
  return children;
};

export default ProtectedRoute;
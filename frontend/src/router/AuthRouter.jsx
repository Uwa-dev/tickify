import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AuthRouter = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};
export default AuthRouter;
 
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  // not logged in -> admin pages go to the admin login, the rest to the lamp page
  if (!user)
    return (
      <Navigate
        to={adminOnly ? "/admin/login" : "/auth"}
        state={{ from: location }}
        replace
      />
    );

  // logged in but not the admin -> back to the store
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
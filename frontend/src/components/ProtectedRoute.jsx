import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role && userRole !== role) {
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (userRole === "operator") {
      return <Navigate to="/operator" replace />;
    }

    if (userRole === "commuter") {
      return <Navigate to="/commuter" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

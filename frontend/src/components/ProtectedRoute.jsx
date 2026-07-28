import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {

    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (userRole !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}
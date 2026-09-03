import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import Reports from "./pages/admin/Reports";

import OperatorDashboard from "./pages/OperatorDashboard";
import OperatorIncidents from "./pages/OperatorIncidents";
import CommuterDashboard from "./pages/CommuterDashboard";

import Prediction from "./pages/Prediction";
import LiveMap from "./pages/LiveMap";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      {/* ================= LOGIN ================= */}

      <Route path="/" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/live-traffic"
        element={
          <ProtectedRoute role="admin">
            <LiveMap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/prediction"
        element={
          <ProtectedRoute role="admin">
            <Prediction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute role="admin">
            <Alerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute role="admin">
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* ================= OPERATOR ================= */}

      <Route
        path="/operator"
        element={
          <ProtectedRoute role="operator">
            <OperatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/alerts"
        element={
          <ProtectedRoute role="operator">
            <Alerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/incidents"
        element={
          <ProtectedRoute role="operator">
            <OperatorIncidents />
          </ProtectedRoute>
        }
      />

      {/* Operator reports */}
      <Route
        path="/operator/reports"
        element={
          <ProtectedRoute role="operator">
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Operator analytics */}
      <Route
        path="/operator/analytics"
        element={
          <ProtectedRoute role="operator">
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Operator live traffic */}
      <Route
        path="/operator/live-traffic"
        element={
          <ProtectedRoute role="operator">
            <LiveMap />
          </ProtectedRoute>
        }
      />

      {/* Operator prediction */}
      <Route
        path="/operator/prediction"
        element={
          <ProtectedRoute role="operator">
            <Prediction />
          </ProtectedRoute>
        }
      />

      {/* ================= COMMUTER ================= */}

      <Route
        path="/commuter"
        element={
          <ProtectedRoute role="commuter">
            <CommuterDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/commuter/reports"
        element={
          <ProtectedRoute role="commuter">
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/commuter/analytics"
        element={
          <ProtectedRoute role="commuter">
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* ================= GENERAL AUTHENTICATED ================= */}

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prediction"
        element={
          <ProtectedRoute>
            <Prediction />
          </ProtectedRoute>
        }
      />

      <Route
        path="/live-map"
        element={
          <ProtectedRoute>
            <LiveMap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

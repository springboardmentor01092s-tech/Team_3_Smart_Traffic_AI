import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import CommuterDashboard from "./pages/CommuterDashboard";
import Prediction from "./pages/Prediction";
import LiveMap from "./pages/LiveMap";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator"
        element={
          <ProtectedRoute role="operator">
            <OperatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/commuter"
        element={
          <ProtectedRoute role="commuter">
            <CommuterDashboard />
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
        path="/operator/alerts"
        element={
          <ProtectedRoute role="operator">
            <Alerts />
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

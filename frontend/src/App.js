import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import CommuterDashboard from "./pages/CommuterDashboard";



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

    </Routes>

  );

}

export default App;
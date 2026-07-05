import { Routes, Route } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "./AuthGuards";

import ForgotPassword from "../pages/Auth/ForgotPassword";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import Landing from "../pages/Landing/Landing";

function AppRoutes() {
  return (
    <Routes>
      {/* Public — no guard needed */}
      <Route path="/" element={<Landing />} />

      {/* Guest-only routes: redirect to /dashboard if already logged in */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />

      {/* Protected routes: redirect to /login if not logged in */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

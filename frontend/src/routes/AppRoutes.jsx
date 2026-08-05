import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "./AuthGuards";

import ForgotPassword from "../pages/Auth/ForgotPassword";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import Landing from "../pages/Landing/Landing";
import GuestCleanPage from "../pages/Landing/GuestCleanPage";
import NotFound from "../pages/NotFound";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public — no guard needed */}
        <Route path="/" element={<Landing />} />
        <Route path="/clean" element={<GuestCleanPage />} />
        <Route path="/guest-cleaner" element={<GuestCleanPage />} />

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
          element={<ForgotPassword />}
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

        {/* Catch-all 404 Page Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRoutes;

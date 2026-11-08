import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  allowedRoles?: Array<"admin" | "issuer" | "student" | "verifier">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner label="Validating authenticated session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If student tries to visit admin routes or vice versa, redirect to their home
    return <Navigate to={user.role === "student" ? "/student/dashboard" : "/admin/dashboard"} replace />;
  }

  return <Outlet />;
};

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthState } from "context/auth";
import { Paths } from "constants/index";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = Paths.LOGIN,
}) => {
  const { isLoggedIn } = useAuthState();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isLoggedIn) {
    // Save the attempted location for redirect after login
    return <Navigate replace state={{ from: location }} to={redirectTo} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

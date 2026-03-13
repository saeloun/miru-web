import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthState } from "context/auth";
import { useUserContext } from "context/UserContext";
import { Paths } from "constants/index";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = Paths.SIGN_IN,
}) => {
  const { isLoggedIn } = useAuthState();
  const { user } = useUserContext();
  const location = useLocation();
  const isAuthenticated = isLoggedIn || Boolean(user?.email);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate replace state={{ from: location }} to={redirectTo} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

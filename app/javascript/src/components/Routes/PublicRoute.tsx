import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "context/auth";
import { useUserContext } from "context/UserContext";
import { Paths } from "constants/index";

interface PublicRouteProps {
  children?: React.ReactNode;
  restricted?: boolean;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
  redirectTo = Paths.DASHBOARD,
}) => {
  const { isLoggedIn } = useAuthState();
  const { user } = useUserContext();
  const isAuthenticated = isLoggedIn || Boolean(user?.email);

  // If logged in and trying to access a restricted route (login/signup), redirect
  if (isAuthenticated && restricted) {
    return <Navigate replace to={redirectTo} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;

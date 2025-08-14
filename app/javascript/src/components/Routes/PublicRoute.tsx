import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "context/auth";
import { Paths } from "constants/index";

interface PublicRouteProps {
  children?: React.ReactNode;
  restricted?: boolean;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
  redirectTo = Paths.TIME_TRACKING,
}) => {
  const { isLoggedIn } = useAuthState();

  // If logged in and trying to access a restricted route (login/signup), redirect
  if (isLoggedIn && restricted) {
    return <Navigate replace to={redirectTo} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;

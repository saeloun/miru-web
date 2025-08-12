import React, { useEffect } from "react";

import ErrorPage from "common/Error";
import Layout from "components/Profile/index";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { Routes, Route, Navigate } from "react-router-dom";

import { SETTINGS } from "./routes";

import UserDetailsView from "../Personal/User";

const ProtectedRoute = ({ role, authorisedRoles, children }) => {
  if (authorisedRoles.includes(role)) {
    return children;
  }

  return <Navigate replace to="/error" />;
};

const RouteConfig = () => {
  const { companyRole } = useUserContext();
  const { setIsCalledFromSettings, setIsCalledFromTeam } = useProfileContext();

  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname.startsWith("/settings")) {
      setIsCalledFromSettings(true);
    } else {
      setIsCalledFromSettings(false);
    }

    if (pathname.startsWith("/team")) {
      setIsCalledFromTeam(true);
    } else {
      setIsCalledFromTeam(false);
    }
  }, []);

  return (
    <Routes>
      {window.location.pathname.startsWith("/team") && (
        <Route element={<Layout />} path=":memberId">
          {SETTINGS.filter(({ category }) => category === "personal").map(
            ({ path, authorisedRoles, Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute
                    authorisedRoles={authorisedRoles}
                    role={companyRole}
                  >
                    <Component />
                  </ProtectedRoute>
                }
              />
            )
          )}
        </Route>
      )}
      {window.location.pathname.startsWith("/settings") && (
        <Route element={<Layout />} path="profile/*">
          <Route index element={<UserDetailsView />} />
          {SETTINGS.map(({ path, authorisedRoles, Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute
                  authorisedRoles={authorisedRoles}
                  role={companyRole}
                >
                  <Component />
                </ProtectedRoute>
              }
            />
          ))}
        </Route>
      )}
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );
};

export default RouteConfig;

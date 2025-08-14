import React, { useEffect } from "react";

import ErrorPage from "common/Error";
import Layout from "components/Profile/index";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

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
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname.startsWith("/settings")) {
      setIsCalledFromSettings(true);
      setIsCalledFromTeam(false);
    } else if (pathname.startsWith("/team")) {
      setIsCalledFromTeam(true);
      setIsCalledFromSettings(false);
    }
  }, [location.pathname, setIsCalledFromSettings, setIsCalledFromTeam]);

  // Check if we're in team or settings context
  const isTeamContext = location.pathname.startsWith("/team");
  const isSettingsContext = location.pathname.startsWith("/settings");

  return (
    <Routes>
      {/* Team member routes */}
      {isTeamContext && (
        <Route element={<Layout />} path="/">
          <Route index element={<UserDetailsView />} />
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
      {/* Settings routes - Fixed to handle all settings paths directly */}
      {isSettingsContext && (
        <Route element={<Layout />} path="/">
          <Route index element={<Navigate to="/settings/profile" replace />} />
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
      {/* Fallback for neither context - render all routes */}
      {!isTeamContext && !isSettingsContext && (
        <Route element={<Layout />} path="*">
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

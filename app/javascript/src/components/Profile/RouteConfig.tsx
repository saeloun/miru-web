import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";

import { SETTINGS_ROUTES } from "./routes";

const ProtectedRoute = ({ role, authorisedRoles, children }) => {
  if (authorisedRoles.includes(role)) {
    return children;
  }

  return <Navigate replace to="/error" />;
};

const RouteConfig = () => {
  const { companyRole } = useUserContext();

  return (
    <Routes>
      {SETTINGS_ROUTES.map(({ path, authorisedRoles, Component }) => (
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
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );
};

export default RouteConfig;

import React, { useEffect } from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import teamsApi from "apis/teams";
import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";

import { useProfile } from "./context/EntryContext";
import { SETTINGS_ROUTES } from "./routes";

const ProtectedRoute = ({ role, authorisedRoles, children }) => {
  if (authorisedRoles.includes(role)) {
    return children;
  }

  return <Navigate replace to="/error" />;
};

const RouteConfig = () => {
  const { user, companyRole } = useUserContext();
  const {
    setUserState,
    profileSettings: { first_name, last_name },
  } = useProfile();

  const getData = async () => {
    if (!first_name && !last_name) {
      const res = await teamsApi.get(user.id);
      if (res.status && res.status == 200) {
        const addressData = await teamsApi.getAddress(user.id);
        const userObj = teamsMapper(res.data, addressData.data.addresses[0]);
        setUserState("profileSettings", userObj);
      }
    }
  };

  useEffect(() => {
    getData();
  }, []);

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

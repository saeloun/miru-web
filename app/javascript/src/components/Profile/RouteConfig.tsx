import React, { useEffect } from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import profileApi from "apis/profile";
import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";

import { useProfile } from "./context/EntryContext";
import { SETTINGS_ROUTES } from "./routes";

import Toastr from "../../StyledComponents/Toastr";

const ProtectedRoute = ({ role, authorisedRoles, children }) => {
  if (authorisedRoles.includes(role)) {
    return children;
  }

  return <Navigate replace to="/error" />;
};

const RouteConfig = () => {
  const { companyRole } = useUserContext();
  const {
    setUserState,
    profileSettings: { first_name, last_name },
  } = useProfile();

  const getData = async () => {
    if (!first_name && !last_name) {
      const data = await profileApi.index();
      if (data.status && data.status == 200) {
        const addressData = await profileApi.getAddress(data.data.user.id);
        const userObj = teamsMapper(
          data.data.user,
          addressData.data.addresses[0]
        );
        setUserState("profileSettings", userObj);
      } else {
        Toastr.error("Something went wrong.");
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

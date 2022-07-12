import React from "react";
import {
  Routes,
  Route,
  Outlet,
  Navigate
} from "react-router-dom";

import ErrorPage from "common/Error";
import { Roles, Paths } from "constants/index";
import ROUTES from "constants/routes";

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;
    return;
  }
  if (authorisedRoles.includes(role)){
    return <Outlet />;
  }
  const url = role === Roles.BOOK_KEEPER ? Paths.PAYMENTS : Paths.TIME_TRACKING;
  return <Navigate to={url} />;
};

const Main = (props) => {
  const { user, companyRole } = props;
  const isAdminUser = [Roles.ADMIN, Roles.OWNER].includes(companyRole);
  return (
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <Routes>
        {ROUTES.map(parentRoute => (
          <Route
            key={parentRoute.path}
            path={parentRoute.path}
            element={
              <RestrictedRoute authorisedRoles={parentRoute.authorisedRoles} role={companyRole} user={user} />
            } >
            {parentRoute.subRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component isAdminUser={isAdminUser} user={user} />} /> //TODO: Move user data to context
            ))}
          </Route>
        ))}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </div>
  );};

export default Main;

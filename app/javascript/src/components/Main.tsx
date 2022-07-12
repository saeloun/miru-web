import React from "react";
import {
  Routes,
  Route,
  Outlet
} from "react-router-dom";

import ErrorPage from "common/Error";
import ROUTES from "./routes";

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  if (!user) {
    window.location.href = "/user/sign_in";
    return;
  }
  if (authorisedRoles.includes(role)){
    return <Outlet />;
  }
  else { //unauthorised user
    const url = role === "book_keeper" ? "/payments" : "/time-tracking";
    window.location.href = url;
    return;
  }
};

const Main = (props) => {
  const { user, companyRole } = props;
  const isAdminUser = ["admin","owner"].includes(companyRole);
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

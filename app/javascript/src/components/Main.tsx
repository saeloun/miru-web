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

const Main: React.FC<Iprops> = (props) => (
  <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
    <Routes>
      {ROUTES.map(parentRoute => (
        <Route
          key={parentRoute.path}
          path={parentRoute.path}
          element={
            <RestrictedRoute authorisedRoles={parentRoute.authorisedRoles} role={props.companyRole} user={props.user} />
          } >
          {parentRoute.subRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component {...props} />} /> //TODO: Move user data to context
          ))}
        </Route>
      ))}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  </div>
);

  interface Iprops {
    user: object;
    companyRole: Roles;
    company: object;
  }

export default Main;

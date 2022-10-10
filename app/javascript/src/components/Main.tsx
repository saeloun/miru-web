import React from "react";

import { Roles, Paths } from "constants/index";
import ROUTES from "constants/routes";

import {
  Routes,
  Route,
  Outlet,
  Navigate
} from "react-router-dom";

import ErrorPage from "common/Error";

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
  <div className="w-5/6 px-8 md:px-20 md:py-3 font-manrope absolute top-0 bottom-0 right-0 overflow-y-0">
    <Routes>
      {ROUTES.map((parentRoute) => (
        <Route
          key={parentRoute.path}
          path={parentRoute.path}
          element={
            <RestrictedRoute
              authorisedRoles={parentRoute.authorisedRoles}
              role={props.companyRole}
              user={props.user}
            />
          }
        >
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

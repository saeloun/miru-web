import React from "react";

import { Routes, Route, Outlet, Navigate } from "react-router-dom";

import ErrorPage from "common/Error";
import { Roles, Paths } from "constants/index";
import ROUTES from "constants/routes";

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;

    return;
  }

  if (authorisedRoles.includes(role)) {
    return <Outlet />;
  }
  const url = role === Roles.BOOK_KEEPER ? Paths.PAYMENTS : Paths.TIME_TRACKING;

  return <Navigate to={url} />;
};

const Main: React.FC<Iprops> = props => (
  <div className="overflow-x-scroll px-4 py-12 font-manrope lg:absolute lg:top-0 lg:bottom-0 lg:right-0 lg:w-5/6 lg:px-20 lg:py-3">
    <Routes>
      {ROUTES.map(parentRoute => (
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
            <Route element={<Component {...props} />} key={path} path={path} /> //TODO: Move user data to context
          ))}
        </Route>
      ))}
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  </div>
);

interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
}

export default Main;

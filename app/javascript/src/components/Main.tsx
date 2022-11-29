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
  <div className="overflow-y-0 absolute top-0 bottom-0 right-0 w-5/6 px-8 font-manrope md:px-20 md:py-3">
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
}

export default Main;

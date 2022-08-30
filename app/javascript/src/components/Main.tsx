import React from "react";

import { Roles, Paths } from "constants/index";
import ROUTES from "constants/routes";

import { Routes, Route, Outlet, Navigate } from "react-router-dom";

import ErrorPage from "common/Error";

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
const SubRoutesAuth = ({
  authorisedRoles,
  role,
  user,
  path,
  Component,
  ...rest
}) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;
    return;
  }
  if (authorisedRoles.includes(role)) {
    return <Route key={path} path={path} element={<Component {...rest} />} />;
  }
  const url = role === Roles.BOOK_KEEPER ? Paths.PAYMENTS : Paths.TIME_TRACKING;

  return (
    <React.Fragment>
      {" "}
      <Navigate to={url} />;
    </React.Fragment>
  );
};

const Main: React.FC<Iprops> = (props) => (
  <div className="w-5/6 md:px-20 md:py-3 font-manrope">
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
          {parentRoute.subRoutes.map(
            ({ path, Component, authorisedRoles }) => {
              if (authorisedRoles) {
                return (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <SubRoutesAuth
                        authorisedRoles={authorisedRoles}
                        role={props.companyRole}
                        user={props.user}
                        path={path}
                        Component={Component}
                        {...props}
                      />
                    }
                  />
                );
              } else {
                return (
                  <Route
                    key={path}
                    path={path}
                    element={<Component {...props} />}
                  />
                );
              }
            }

            //TODO: Move user data to context
          )}
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

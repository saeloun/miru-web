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

const RestrictedRoute = ({ user, role, authorisedRoles, permissions, permissionId }) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;
    return;
  }
  if (permissionId && permissions[permissionId] === true) {
    return <Outlet />;
  }
  if (authorisedRoles.includes(role)){
    return <Outlet />;
  }
  const url = role === Roles.BOOK_KEEPER ? Paths.PAYMENTS : Paths.SPACES;
  return <Navigate to={url} />;
};

const Main: React.FC<Iprops> = (props) => (
  <div className="content-wrapper px-8 md:px-20 md:py-3 font-manrope absolute top-0 bottom-0 right-0 overflow-y-0">
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
              permissionId={parentRoute.permissionId}
              permissions={props.permissions}
            />
          }
        >
          {parentRoute.subRoutes.map(({ path, Component, permissionId }) => {
            if (permissionId && props.permissions[permissionId] === false) return

            return (
              <Route key={path} path={path} element={<Component {...props} />} /> //TODO: Move user data to context
            )
          })}
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
    permissions: object;
  }

export default Main;

import React from "react";

import { Routes, Route, Outlet, Navigate } from "react-router-dom";

import ErrorPage from "common/Error";
import { Roles, Paths } from "constants/index";
import { ROUTES } from "constants/routes";

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;

    return null;
  }

  if (authorisedRoles.includes(role)) {
    return <Outlet />;
  }

  let url;

  switch (role) {
    case Roles.BOOK_KEEPER:
      url = Paths.PAYMENTS;
      break;
    case Roles.OWNER:
      url = "invoices";
      break;
    case Roles.CLIENT:
      url = "invoices";
      break;
    default:
      url = Paths.TIME_TRACKING;
      break;
  }

  return <Navigate to={url} />;
};

const RootElement = ({ role }) => {
  let url;
  switch (role) {
    case Roles.OWNER:
      url = "invoices";
      break;
    case Roles.BOOK_KEEPER:
      url = Paths.PAYMENTS;
      break;
    case Roles.CLIENT:
      url = "invoices";
      break;
    default:
      url = Paths.TIME_TRACKING;
      break;
  }

  return <Navigate to={url} />;
};

const Home = (props: Iprops) => {
  const { companyRole } = props;

  return (
    <div className="h-full overflow-x-scroll p-0 font-manrope lg:absolute lg:top-0 lg:bottom-0 lg:right-0 lg:w-5/6 lg:px-20 lg:py-3">
      <Routes>
        <Route element={<RootElement role={companyRole} />} path="/" />
        {ROUTES.map(parentRoute => (
          <Route
            key={parentRoute.path}
            path={parentRoute.path}
            element={
              <RestrictedRoute
                authorisedRoles={parentRoute.authorisedRoles}
                role={companyRole}
                user={props.user}
              />
            }
          >
            {parentRoute.subRoutes.map(({ path, Component }) => (
              <Route
                element={<Component {...props} />}
                key={path}
                path={path}
              />
            ))}
          </Route>
        ))}
        <Route path={Paths.AUTHORIZATION} />
        <Route element={<ErrorPage />} path="*" />
      </Routes>
    </div>
  );
};

interface Iprops {
  user: object;
  companyRole: Roles;
  company: object;
  isDesktop: boolean;
  isAdminUser: boolean;
}

export default Home;

import React from "react";

import Cookies from "js-cookie";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "routes";

import ErrorPage from "common/Error";
import { Roles, Paths } from "constants/index";
import { dashboardUrl } from "utils/dashboardUrl";

const redirectUrl = role => {
  const lastVisitedPage = Cookies.get("lastVisitedPage");
  let url = dashboardUrl(role);

  if (lastVisitedPage && lastVisitedPage !== "/") {
    url = lastVisitedPage;
  }

  Cookies.remove("lastVisitedPage");

  return url;
};

const RootElement = ({ role }) => {
  const url = redirectUrl(role);

  return <Navigate to={url} />;
};

const RestrictedRoute = ({ user, role, authorisedRoles, children }) => {
  if (!user) {
    window.location.href = Paths.SIGN_IN;

    return null;
  }

  if (authorisedRoles.includes(role)) {
    return children;
  }

  const url = redirectUrl(role);

  return <Navigate to={url} />;
};

const Home = (props: Iprops) => {
  const { user, companyRole } = props;

  return (
    <div className="h-full overflow-x-scroll p-0 font-manrope lg:absolute lg:top-0 lg:bottom-0 lg:right-0 lg:w-5/6 lg:px-20 lg:py-3">
      <Routes>
        <Route element={<RootElement role={companyRole} />} path="/" />
        {ROUTES.map(({ path, authorisedRoles, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <RestrictedRoute
                authorisedRoles={authorisedRoles}
                role={companyRole}
                user={user}
              >
                <Component />
              </RestrictedRoute>
            }
          />
        ))}
        <Route element={<ErrorPage />} path="*" />
      </Routes>
    </div>
  );
};

interface Iprops {
  user: object;
  companyRole: Roles;
}

export default Home;

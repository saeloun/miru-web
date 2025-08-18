import { Roles, Paths } from "constants/index";
import { ROUTES } from "constants/routes";

import React from "react";

import ErrorPage from "common/Error";
import Cookies from "js-cookie";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { dashboardUrl } from "utils/dashboardUrl";
import { useUserContext } from "context/UserContext";

const redirectUrl = role => {
  const lastVisitedPage = Cookies.get("lastVisitedPage");
  let url = dashboardUrl(role);

  if (lastVisitedPage && lastVisitedPage !== "/") {
    url = lastVisitedPage;
  }

  Cookies.remove("lastVisitedPage");

  return url;
};

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  const { loading } = useUserContext();

  if (loading || !user) {
    // Show loading state while user data is being fetched
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-miru-dark-purple-1000">Loading...</div>
      </div>
    );
  }

  if (authorisedRoles.includes(role)) {
    return <Outlet />;
  }

  const url = redirectUrl(role);

  return <Navigate to={url} />;
};

const RootElement = ({ role }) => {
  const url = redirectUrl(role);

  return <Navigate to={url} />;
};

const Home = (props: Iprops) => {
  const { companyRole, company_role } = props;
  const role = companyRole || company_role;

  return (
    <div className="h-full overflow-x-scroll p-0 font-inter lg:absolute lg:top-0 lg:bottom-0 lg:right-0 lg:w-5/6 lg:px-20 lg:py-3">
      <Routes>
        <Route element={<RootElement role={role} />} path="/" />
        {ROUTES.map(parentRoute => (
          <Route
            key={parentRoute.path}
            path={parentRoute.path}
            element={
              <RestrictedRoute
                authorisedRoles={parentRoute.authorisedRoles}
                role={role}
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

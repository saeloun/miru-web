import { Roles, Paths } from "constants/index";
import { ROUTES } from "constants/routes";

import React from "react";

import ErrorPage from "common/Error";
import Loader from "common/Loader/index";
import Cookies from "js-cookie";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { dashboardUrl } from "utils/dashboardUrl";
import { useUserContext } from "context/UserContext";

const isSafeInternalPath = (p: string): boolean => {
  const trimmed = (p || "").trim();
  if (!trimmed.startsWith("/")) return false;

  if (trimmed.startsWith("//")) return false; // scheme-relative

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false; // absolute schemes

  return true;
};

const pathAllowedForRole = (path: string, role: Roles): boolean =>
  ROUTES.some(route => {
    if (!route.authorisedRoles.includes(role)) return false;

    const basePath = route.path.replace("/*", "");
    if (basePath === Paths.DASHBOARD) {
      return path === Paths.DASHBOARD;
    }

    return path === basePath || path.startsWith(`${basePath}/`);
  });

const redirectUrl = role => {
  const lastVisitedPage = Cookies.get("lastVisitedPage");
  let url = dashboardUrl(role);

  if (
    lastVisitedPage &&
    isSafeInternalPath(lastVisitedPage) &&
    pathAllowedForRole(lastVisitedPage, role)
  ) {
    url = lastVisitedPage;
  }

  Cookies.remove("lastVisitedPage");

  return url;
};

const RestrictedRoute = ({ user, role, authorisedRoles }) => {
  const { loading } = useUserContext();

  if (loading || !user || !role) {
    return <Loader className="h-screen" />;
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
    <div className="min-h-full font-geist">
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

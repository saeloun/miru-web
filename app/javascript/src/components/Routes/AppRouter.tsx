import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Paths } from "constants/index";

// Route Protection
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Authentication Components
import RouteErrorBoundary from "common/RouteErrorBoundary";
import { dashboardUrl } from "utils/dashboardUrl";

const SignIn = lazy(() => import("components/Authentication/SignIn"));
const SignUp = lazy(() => import("components/Authentication/SignUp"));
const ForgotPassword = lazy(
  () => import("components/Authentication/ForgotPassword")
);

const EmailVerification = lazy(
  () => import("components/Authentication/EmailVerification")
);

const EmailVerificationSuccess = lazy(
  () =>
    import(
      "components/Authentication/EmailVerification/EmailVerificationSuccess"
    )
);
const Dashboard = lazy(() => import("components/Dashboard"));
const OrganizationSetup = lazy(() => import("components/OrganizationSetup"));
const SignUpSuccess = lazy(
  () => import("components/OrganizationSetup/SignUpSuccess")
);
const Success = lazy(() => import("components/payments/Success"));
const InvalidLink = lazy(() => import("components/Team/List/InvalidLink"));
const InvoiceEmail = lazy(() => import("components/InvoiceEmail"));
const ErrorPage = lazy(() => import("common/Error"));

interface AppRouterProps {
  user?: any;
  companyRole?: string;
  confirmedUser?: boolean;
  isDesktop?: boolean;
  isAdminUser?: boolean;
  googleOauthSuccess?: boolean;
}

const AppRouter: React.FC<AppRouterProps> = props => {
  const needsOrganizationSetup =
    props.user && !props.user?.current_workspace_id;
  const defaultAuthedPath = dashboardUrl(props.companyRole);
  const loadingFallback = (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
      Loading…
    </div>
  );

  const withSuspense = (element: React.ReactNode) => (
    <Suspense fallback={loadingFallback}>{element}</Suspense>
  );

  return (
    <>
      <Routes>
        <Route
          element={withSuspense(<Success />)}
          path={Paths.PAYMENT_SUCCESS}
        />
        <Route
          element={withSuspense(<InvalidLink />)}
          path={Paths.INVALID_LINK}
        />
        <Route
          element={withSuspense(<InvoiceEmail />)}
          path={Paths.PUBLIC_INVOICE}
        />

        <Route
          element={
            props.user ? (
              needsOrganizationSetup ? (
                <RouteErrorBoundary resetKey="organization-setup">
                  {withSuspense(<OrganizationSetup />)}
                </RouteErrorBoundary>
              ) : (
                <Navigate replace to={defaultAuthedPath} />
              )
            ) : (
              <Navigate replace to={Paths.SIGN_IN} />
            )
          }
          path="/"
        />

        <Route
          element={withSuspense(<EmailVerificationSuccess />)}
          path={Paths.EMAIL_VERIFICATION_SUCCESS}
        />
        <Route
          element={withSuspense(<EmailVerificationSuccess />)}
          path="/email_confirmed"
        />

        <Route
          element={<PublicRoute restricted redirectTo={defaultAuthedPath} />}
        >
          <Route element={withSuspense(<SignIn />)} path={Paths.SIGN_IN} />
          <Route element={withSuspense(<SignIn />)} path={Paths.LOGIN} />
          <Route element={withSuspense(<SignUp />)} path={Paths.SIGNUP} />
          <Route
            element={withSuspense(<ForgotPassword />)}
            path={Paths.FORGOT_PASSWORD}
          />
          <Route
            element={withSuspense(<EmailVerification />)}
            path={Paths.EMAIL_VERIFICATION}
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          {needsOrganizationSetup && (
            <Route
              element={withSuspense(<SignUpSuccess />)}
              path={Paths.SIGNUP_SUCCESS}
            />
          )}
          {!needsOrganizationSetup && (
            <Route
              element={
                <RouteErrorBoundary resetKey="dashboard-shell">
                  {withSuspense(<Dashboard {...props} />)}
                </RouteErrorBoundary>
              }
              path="/*"
            />
          )}
        </Route>

        <Route element={withSuspense(<ErrorPage />)} path="*" />
      </Routes>
    </>
  );
};

export default AppRouter;

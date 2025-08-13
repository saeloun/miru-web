import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Paths } from "constants/index";

// Route Protection
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Authentication Components
import SignIn from "components/Authentication/SignIn";
import SignUp from "components/Authentication/SignUp";
import ForgotPassword from "components/Authentication/ForgotPassword";
import EmailVerification from "components/Authentication/EmailVerification";
import EmailVerificationSuccess from "components/Authentication/EmailVerification/EmailVerificationSuccess";

// Main Components
import Dashboard from "components/Dashboard";
import OrganizationSetup from "components/OrganizationSetup";
import SignUpSuccess from "components/OrganizationSetup/SignUpSuccess";

// Feature Components
import Success from "components/payments/Success";
import InvalidLink from "components/Team/List/InvalidLink";
import InvoiceEmail from "components/InvoiceEmail";
import ErrorPage from "common/Error";

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

  return (
    <Routes>
      {/* Public Routes - Available to everyone */}
      <Route element={<Success />} path={Paths.PAYMENT_SUCCESS} />
      <Route element={<InvalidLink />} path={Paths.INVALID_LINK} />
      <Route element={<InvoiceEmail />} path={Paths.PUBLIC_INVOICE} />
      {/* Auth Routes - Only for non-authenticated users */}
      <Route element={<PublicRoute restricted />}>
        <Route element={<SignIn />} path={Paths.LOGIN} />
        <Route element={<SignUp />} path={Paths.SIGNUP} />
        <Route element={<ForgotPassword />} path={Paths.FORGOT_PASSWORD} />
        <Route
          element={<EmailVerification />}
          path={Paths.EMAIL_VERIFICATION}
        />
        <Route
          element={<EmailVerificationSuccess />}
          path={Paths.EMAIL_VERIFICATION_SUCCESS}
        />
      </Route>
      {/* Protected Routes - Only for authenticated users */}
      <Route element={<ProtectedRoute />}>
        {needsOrganizationSetup ? (
          <>
            <Route element={<OrganizationSetup />} path="/" />
            <Route element={<SignUpSuccess />} path={Paths.SIGNUP_SUCCESS} />
            <Route element={<Navigate replace to="/" />} path="*" />
          </>
        ) : (
          <>
            {/* Default redirect for authenticated users */}
            <Route
              element={<Navigate replace to={Paths.TIME_TRACKING} />}
              path="/"
            />
            {/* Dashboard handles all authenticated routes */}
            <Route element={<Dashboard {...props} />} path="*" />
          </>
        )}
      </Route>
      {/* 404 - Catch all */}
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );
};

export default AppRouter;

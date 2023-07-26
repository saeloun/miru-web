import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import { useUserContext } from "context/UserContext";

import GoogleCalendar from "./GoogleCalendar";
import MobileNav from "./Layout/MobileNav";
import LeaveBalance from "./LeaveBalance";
import Billing from "./Organization/Billing";
import OrgDetails from "./Organization/Details";
import OrgEdit from "./Organization/Edit";
import Import from "./Organization/Import";
import LeavesAndHolidays from "./Organization/LeavesAndHolidays";
import PaymentSettings from "./Organization/Payment";
import UserDetailsEdit from "./UserDetail/Edit";
import UserDetailsView from "./UserDetail/UserDetailsView";

const ProtectedRoute = ({ isAdminUser, children }) => {
  if (!isAdminUser) {
    return <Navigate replace to="/error" />;
  }

  return children;
};

const RouteConfig = () => {
  const { isAdminUser } = useUserContext();

  return (
    <Routes>
      <Route path="/edit">
        {/* <Route path="bank_account_details" element={<BankAccountDetails />} /> TODO: Temporary disabling*/}
        <Route element={<UserDetailsView />} path="" />
        <Route element={<PaymentSettings />} path="payment" />
        <Route element={<Billing />} path="billing" />
        <Route
          path="organization"
          element={
            <ProtectedRoute isAdminUser={isAdminUser}>
              <OrgEdit />
            </ProtectedRoute>
          }
        />
        <Route element={<Import />} path="import" />
        <Route element={<LeavesAndHolidays />} path="leaves" />
        <Route element={<LeaveBalance />} path="leave-balance" />
        <Route
          path="organization-details"
          element={
            <ProtectedRoute isAdminUser={isAdminUser}>
              <OrgDetails />
            </ProtectedRoute>
          }
        />
        <Route element={<UserDetailsEdit />} path="change" />
        <Route element={<MobileNav isAdmin={isAdminUser} />} path="option" />
        <Route
          element={<GoogleCalendar isAdmin={isAdminUser} />}
          path="integrations"
        />
      </Route>
    </Routes>
  );
};

export default RouteConfig;

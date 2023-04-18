import React from "react";

import { Routes, Route } from "react-router-dom";

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

const RouteConfig = () => (
  <Routes>
    <Route path="/edit">
      {/* <Route path="bank_account_details" element={<BankAccountDetails />} /> TODO: Temporary disabling*/}
      <Route element={<UserDetailsView />} path="" />
      <Route element={<PaymentSettings />} path="payment" />
      <Route element={<Billing />} path="billing" />
      <Route element={<OrgEdit />} path="organization" />
      <Route element={<Import />} path="import" />
      <Route element={<LeavesAndHolidays />} path="leaves" />
      <Route element={<LeaveBalance />} path="leave-balance" />
      <Route element={<OrgDetails />} path="organization-details" />
      <Route element={<UserDetailsEdit />} path="change" />
      <Route element={<MobileNav />} path="option" />
      {/* </Route> */}
    </Route>
  </Routes>
);

export default RouteConfig;

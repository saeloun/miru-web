import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import BankAccountDetails from "./BankAccountDetails";
import Billing from "./Organization/Billing";
import OrgEdit from "./Organization/Edit";
import OrgPayment from "./Organization/Payment";
import UserDetails from "./UserDetail";

const RouteConfig = () => (
  <Routes>
    <Route path="/profile/edit">
      <Route path="bank_account_details" element={<BankAccountDetails />} />
      <Route path="" element={<UserDetails />} />
      <Route path="paymentsettings" element={<OrgPayment />} />
      <Route path="billing" element={<Billing />} />
      <Route path="organization" element={<OrgEdit />} />
      {/* </Route> */}
    </Route>
  </Routes>
);

export default RouteConfig;

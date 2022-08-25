import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

// import BankAccountDetails from "./BankAccountDetails";
import Billing from "./Organization/Billing";
import OrgEdit from "./Organization/Edit";
import PaymentSettings from "./Organization/Payment";
import UserDetails from "./UserDetail";
import TeamMemberDetails from "./UserDetail";

const RouteConfig = () => (
  <Routes>
    <Route path="/profile/edit">
      {/* <Route path="bank_account_details" element={<BankAccountDetails />} /> TODO: Temporary disabling*/  }
      <Route path="" element={<UserDetails />} />
      <Route path="team_members" element={<TeamMemberDetails />} />
      <Route path="payment" element={<PaymentSettings />} />
      <Route path="billing" element={<Billing />} />
      <Route path="organization" element={<OrgEdit />} />
      {/* </Route> */}
    </Route>
  </Routes>
);

export default RouteConfig;

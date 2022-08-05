import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

// import BankAccountDetails from "./BankAccountDetails";
import Billing from "./Organization/Billing";
import OrgEdit from "./Organization/Edit";
import Import from "./Organization/Import";
import PaymentSettings from "./Organization/Payment";
import UserDetails from "./UserDetail";

const RouteConfig = () => (
  <Routes>
    <Route path="/edit">
      {/* <Route path="bank_account_details" element={<BankAccountDetails />} /> TODO: Temporary disabling*/  }
      <Route path="" element={<UserDetails />} />
      <Route path="payment" element={<PaymentSettings />} />
      <Route path="billing" element={<Billing />} />
      <Route path="organization" element={<OrgEdit />} />
      <Route path="import" element={<Import />} />
      {/* </Route> */}
    </Route>
  </Routes>
);

export default RouteConfig;

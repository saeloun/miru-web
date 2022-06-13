import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import Billing from "./Billing";
import OrgBilling from "./Organization/Billing";
import OrgEdit from "./Organization/Edit";
import OrgPayment from "./Organization/Payment";
import UserDetails from "./UserDetail";

const RouteConfig = () => (
  <Routes>
    <Route path="/profile/edit">
      <Route path="billing" element={<Billing />} />
      <Route path="" element={<UserDetails />} />
      <Route path="paymentsettings" element={<OrgPayment />} />
      <Route path="billing" element={<OrgBilling />} />
      <Route path="organization" element={<OrgEdit />} />
      {/* </Route> */}
    </Route>
  </Routes>
);

export default RouteConfig;

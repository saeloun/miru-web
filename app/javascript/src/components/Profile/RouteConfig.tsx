import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import Billing from "./Billing";
import UserDetails from "./UserDetail";

const RouteConfig = () => (
  <Routes>
    <Route path="/profile/edit">
      <Route path="billing" element={<Billing />} />
      <Route path="" element={<UserDetails />} />
    </Route>
  </Routes>
);

export default RouteConfig;

import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import UserDetails from './UserDetail';
import Billing from './Billing';

const RouteConfig = () => (
  <Routes>
    <Route path="/profile/edit">
      <Route path="billing" element={<Billing />} />
      <Route path="" element={<UserDetails />} />
    </Route>
  </Routes>
);

export default RouteConfig;

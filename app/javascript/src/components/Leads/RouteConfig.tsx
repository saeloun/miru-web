import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Details from "./Details";
import LeadList from "./List";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="leads">
        <Route index element={<LeadList isAdminUser={isAdminUser} />} />
        <Route path=":leadId" element={<Details />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

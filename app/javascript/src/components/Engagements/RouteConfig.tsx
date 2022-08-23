import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import EngagementList from "./List";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="engagements">
        <Route index element={<EngagementList isAdminUser={isAdminUser} />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

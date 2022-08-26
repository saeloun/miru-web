import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import DashboardList from "./Dashboard";
import EngagementList from "./List";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="engagements">
        <Route index element={<EngagementList isAdminUser={isAdminUser} />} />
        {
          isAdminUser && <Route path="dashboard" element={<DashboardList />} />
        }
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

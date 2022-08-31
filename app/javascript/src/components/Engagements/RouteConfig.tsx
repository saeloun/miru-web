import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardList from "./Dashboard";
import EngagementList from "./List";

const RouteConfig = ({ isAdminUser, embedUrl }) => (<BrowserRouter>
  <Routes>
    <Route path="engagements">
      <Route index element={<EngagementList isAdminUser={isAdminUser} />} />
      {
        isAdminUser && <Route path="dashboard" element={<DashboardList isAdminUser={isAdminUser} embedUrl={embedUrl} />} />
      }
    </Route>
  </Routes>
</BrowserRouter>);

export default RouteConfig;

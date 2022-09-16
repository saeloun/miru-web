import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardList from "./Dashboard";
import EngagementList from "./List";

const RouteConfig = ({ isAdminUser, embedUrl, engagementOptions, currentWeekCode, currentWeekDueAt }) => (<BrowserRouter>
  <Routes>
    <Route path="engagements">
      <Route index element={<EngagementList isAdminUser={isAdminUser} engagementOptions={engagementOptions} currentWeekCode={currentWeekCode} currentWeekDueAt={currentWeekDueAt} />} />
      {
        isAdminUser && <Route path="dashboard" element={<DashboardList isAdminUser={isAdminUser} embedUrl={embedUrl} />} />
      }
    </Route>
  </Routes>
</BrowserRouter>);

export default RouteConfig;

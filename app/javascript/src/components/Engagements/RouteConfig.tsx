import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardList from "./Dashboard";
import EngagementList from "./List";

const RouteConfig = ({ isAdminUser }) => (<BrowserRouter>
  <Routes>
    <Route path="engagements">
      <Route index element={
        isAdminUser && location.search.includes("?_h=1") ? (
          <Navigate to={{ pathname: "/engagements/dashboard" }} />
        ) : (
          <EngagementList isAdminUser={isAdminUser} />
        )
      } />
      {
        isAdminUser && <Route path="dashboard" element={<DashboardList isAdminUser={isAdminUser} />} />
      }
    </Route>
  </Routes>
</BrowserRouter>);

export default RouteConfig;

import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import DevicesList from "./List";

const RouteConfig = ({ isAdminUser, androidAppUrl, iosAppUrl }) => (
  <BrowserRouter>
    <Routes>
      <Route path="tackle">
        <Route index element={<DevicesList isAdminUser={isAdminUser} androidAppUrl={androidAppUrl} iosAppUrl={iosAppUrl} />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

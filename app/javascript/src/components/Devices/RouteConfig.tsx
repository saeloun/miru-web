import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import DevicesList from "./List";

const RouteConfig = () => (
  <BrowserRouter>
    <Routes>
      <Route path="devices">
        <Route index element={<DevicesList />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

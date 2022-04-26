import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import ErrorPage from "common/Error";
import PlanSelection from "./PlanSelection";

const RouteConfig = () => (
  <BrowserRouter>
    <Routes>
      <Route path="subscriptions">
        <Route index element={<PlanSelection />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

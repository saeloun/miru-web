import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import ErrorPage from "common/Error";
import List from "./List";

const RouteConfig = () => (
  <BrowserRouter>
    <Routes>
      <Route path="payments">
        <Route index element={<List />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

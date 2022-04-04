import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Generate from "./Generate";
import List from "./List";

const RouteConfig = () => (
  <BrowserRouter>
    <Routes>
      <Route path="invoices">
        <Route index element={<List />} />
        <Route path=":invoiceId" element={<Generate />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

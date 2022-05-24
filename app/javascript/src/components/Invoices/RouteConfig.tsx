import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import ErrorPage from "common/Error";
import EditInvoice from "./Edit";
import Generate from "./Generate";
import Invoice from "./Invoice";
import List from "./List";

const RouteConfig = () => (
  <BrowserRouter>
    <Routes>
      <Route path="invoices">
        <Route index element={<List />} />
        <Route path="generate" element={<Generate />} />
        <Route path=":id/edit" element={<EditInvoice />} />
        <Route path=":id" element={<Invoice />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

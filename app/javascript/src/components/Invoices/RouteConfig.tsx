import React, { Fragment } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import List from './List';
import Generate from "./Generate";

const RouteConfig = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="invoices">
          <Route index element={<List />} />
          <Route path=":invoiceId" element={<Generate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default RouteConfig

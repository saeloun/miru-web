import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Details from "./Details";
import LeadList from "./List";
import QuoteDetails from "./QuoteDetails";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="leads">
        <Route index element={<LeadList isAdminUser={isAdminUser} />} />
        <Route path=":leadId" element={<Details />} />
        <Route path=":leadId/timelines" element={<Details />} />
        <Route path=":leadId/line-items" element={<Details />} />
        <Route path=":leadId/quotes" element={<Details />} />
        <Route path=":leadId/quotes/:quoteId" element={<QuoteDetails />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;

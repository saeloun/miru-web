import React from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import OutstandingInvoiceReport from "./outstandingInvoices";
import ReportList from "./reportList";
import RevenueByClientReport from "./revenueByClient";
import TimeEntryReports from "./timeEntry";
import TotalHoursReport from "./totalHoursLogged";

const RouteConfig = () => (
  <Routes>
    <Route path="/reports">
      <Route path="" element={<ReportList />} />
      <Route path="time-entry" element={<TimeEntryReports />} />
      <Route path="revenue-by-client" element={<RevenueByClientReport />} />
      <Route path="outstanding-overdue-invoice" element={<OutstandingInvoiceReport />} />
      <Route path="total-hours" element={<TotalHoursReport />} />
    </Route>
  </Routes>
);

export default RouteConfig;

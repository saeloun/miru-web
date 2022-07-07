import React from "react";
import {
  Routes,
  Route
} from "react-router-dom";

import OutstandingInvoiceReport from "./Reports/outstandingInvoices";
import ReportList from "./Reports/reportList";
import RevenueByClientReport from "./Reports/revenueByClient";
import TimeEntryReports from "./Reports/timeEntry";
import TotalHoursReport from "./Reports/totalHoursLogged";

const Main = () => (
  <Routes>
    <Route path="/reports">
      {/* <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope"> */}
      <Route path="" element={<ReportList />} />
      <Route path="time-entry" element={<TimeEntryReports />} />
      <Route path="revenue-by-client" element={<RevenueByClientReport />} />
      <Route path="outstanding-overdue-invoice" element={<OutstandingInvoiceReport />} />
      <Route path="total-hours" element={<TotalHoursReport />} />
      {/* </div> */}
    </Route>
  </Routes>
);

export default Main;

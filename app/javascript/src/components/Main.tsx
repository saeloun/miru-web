import React from "react";
import {
  Routes,
  Route
} from "react-router-dom";

import ErrorPage from "common/Error";
import Details from "./Clients/Details";
import ClientList from "./Clients/List";
import EditInvoice from "./Invoices/Edit";
import Generate from "./Invoices/Generate";
import Invoice from "./Invoices/Invoice";
import List from "./Invoices/List";
import Payments from "./payments";
import ProjectDetails from "./Projects/Details";
import ProjectList from "./Projects/List";
import OutstandingInvoiceReport from "./Reports/outstandingInvoices";
import ReportList from "./Reports/reportList";
import RevenueByClientReport from "./Reports/revenueByClient";
import TimeEntryReports from "./Reports/timeEntry";
import TotalHoursReport from "./Reports/totalHoursLogged";
import PlanSelection from "./Subscriptions/PlanSelection";

const Main = ({ company_role }) => {
  const isAdminUser = ["admin","owner"].includes(company_role);
  return (
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <Routes>
        <Route path="/reports">
          <Route path="" element={<ReportList />} />
          <Route path="time-entry" element={<TimeEntryReports />} />
          <Route path="revenue-by-client" element={<RevenueByClientReport />} />
          <Route path="outstanding-overdue-invoice" element={<OutstandingInvoiceReport />} />
          <Route path="total-hours" element={<TotalHoursReport />} />
        </Route>
        <Route path="clients">
          <Route index element={<ClientList isAdminUser={isAdminUser} />} />
          <Route path=":clientId" element={<Details isAdminUser={isAdminUser}  />} />
        </Route>
        <Route path="invoices">
          <Route index element={<List />} />
          <Route path="generate" element={<Generate />} />
          <Route path=":id/edit" element={<EditInvoice />} />
          <Route path=":id" element={<Invoice />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route path="projects">
          <Route index element={ <ProjectList isAdminUser={isAdminUser} />} />
          <Route path=":projectId" element={<ProjectDetails />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route path="subscriptions">
          <Route index element={<PlanSelection />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route path="payments" element={<Payments />} />
      </Routes>
    </div>
  );};

export default Main;

import React from "react";

import ErrorPage from "common/Error";
import ClientInvoices from "components/ClientInvoices";
import ClientInvoiceDetails from "components/ClientInvoices/Details";
import { useUserContext } from "context/UserContext";
import { Route, Routes } from "react-router-dom";

import EditInvoice from "./Edit";
import GenerateInvoices from "./Generate";
import Invoice from "./Invoice";
import InvoicesList from "./List";

const InvoicesRouteConfig = () => {
  const { companyRole } = useUserContext();

  const clientRoutes = () => (
    <Routes>
      <Route index element={<ClientInvoices />} />
      <Route element={<ClientInvoiceDetails />} path=":id" />
    </Routes>
  );

  const protectedRoutes = () => (
    <Routes>
      <Route index element={<InvoicesList />} />
      <Route element={<GenerateInvoices />} path="generate" />
      <Route element={<EditInvoice />} path=":id/edit" />
      <Route element={<Invoice />} path=":id" />
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );

  return companyRole == "client" ? clientRoutes() : protectedRoutes();
};

export default InvoicesRouteConfig;

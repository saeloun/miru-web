import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";

import InvoicesPage from "./index";

import GenerateInvoices from "./Generate";
import ClientInvoices from "components/ClientInvoices";
import ClientInvoiceDetails from "components/ClientInvoices/Details";

const InvoiceEdit = () => {
  const { id } = useParams();

  return <InvoicesPage initialMode="edit" initialInvoiceId={id} />;
};

const InvoiceView = () => {
  const { id } = useParams();

  return <InvoicesPage initialMode="preview" initialInvoiceId={id} />;
};

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
      <Route index element={<InvoicesPage />} />

      <Route element={<InvoiceEdit />} path=":id/edit" />
      <Route element={<InvoiceView />} path=":id" />

      <Route element={<GenerateInvoices />} path="generate" />

      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );

  return companyRole == "client" ? clientRoutes() : protectedRoutes();
};

export default InvoicesRouteConfig;

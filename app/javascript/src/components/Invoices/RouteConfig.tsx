import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";

import InvoicesPage from "./index";
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

const InvoiceCreate = () => {
  const search = window.location.search;
  const params = new URLSearchParams(search);

  return (
    <InvoicesPage
      initialMode="create"
      initialClientId={params.get("clientId") || ""}
    />
  );
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
      <Route element={<InvoiceCreate />} path="new" />
      <Route
        element={
          <Navigate replace to={`/invoices/new${window.location.search}`} />
        }
        path="generate"
      />
      <Route element={<InvoiceEdit />} path=":id/edit" />
      <Route element={<InvoiceView />} path=":id" />

      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );

  return companyRole == "client" ? clientRoutes() : protectedRoutes();
};

export default InvoicesRouteConfig;

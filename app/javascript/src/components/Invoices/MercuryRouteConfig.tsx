import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import ErrorPage from "common/Error";
import { useUserContext } from "context/UserContext";

// Import Mercury-style components
import InvoicesPage from "./index";

// Import old components for backward compatibility
import GenerateInvoices from "./Generate";
import ClientInvoices from "components/ClientInvoices";
import ClientInvoiceDetails from "components/ClientInvoices/Details";

// Mercury wrapper for edit functionality
const MercuryInvoiceEdit = () => {
  const { id } = useParams();

  // Use the Mercury InvoicesPage component but in edit mode
  return <InvoicesPage initialMode="edit" initialInvoiceId={id} />;
};

// Mercury wrapper for view functionality
const MercuryInvoiceView = () => {
  const { id } = useParams();

  // Use the Mercury InvoicesPage component but in preview mode
  return <InvoicesPage initialMode="preview" initialInvoiceId={id} />;
};

const MercuryInvoicesRouteConfig = () => {
  const { companyRole } = useUserContext();

  const clientRoutes = () => (
    <Routes>
      <Route index element={<ClientInvoices />} />
      <Route element={<ClientInvoiceDetails />} path=":id" />
    </Routes>
  );

  const protectedRoutes = () => (
    <Routes>
      {/* Mercury-style main invoice page - this replaces the old list */}
      <Route index element={<InvoicesPage />} />

      {/* Mercury-style edit and view pages */}
      <Route element={<MercuryInvoiceEdit />} path=":id/edit" />
      <Route element={<MercuryInvoiceView />} path=":id" />

      {/* Keep generate route for backward compatibility */}
      <Route element={<GenerateInvoices />} path="generate" />

      {/* Catch all for errors */}
      <Route element={<ErrorPage />} path="*" />
    </Routes>
  );

  return companyRole == "client" ? clientRoutes() : protectedRoutes();
};

export default MercuryInvoicesRouteConfig;

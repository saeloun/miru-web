import EditInvoice from "components/Invoices/Edit";
import GenerateInvoices from "components/Invoices/Generate";
import Invoice from "components/Invoices/Invoice";
import InvoicesList from "components/Invoices/List";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER } = Roles;

export const InvoiceRoutes = [
  {
    path: "/invoices",
    Component: InvoicesList,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/invoices/generate",
    Component: GenerateInvoices,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/invoices/:id/edit",
    Component: EditInvoice,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/invoices/:id",
    Component: Invoice,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];

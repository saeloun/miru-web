import InvoiceEmail from "components/InvoiceEmail";
import Success from "components/payments/Success";

export const PUBLIC_ROUTES = [
  {
    path: "/invoices/:id/view",
    component: InvoiceEmail,
  },
  {
    path: "/invoices/:id/payments/success",
    component: Success,
  },
];

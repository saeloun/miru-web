import ErrorPage from "common/Error";
import ClientDetails from "./Clients/Details";
import ClientList from "./Clients/List";
import EditInvoice from "./Invoices/Edit";
import GenerateInvoices from "./Invoices/Generate";
import Invoice from "./Invoices/Invoice";
import InvoicesList  from "./Invoices/List";
import Payments from "./payments";
import ProjectDetails from "./Projects/Details";
import ProjectList from "./Projects/List";
import OutstandingInvoiceReport from "./Reports/outstandingInvoices";
import ReportList from "./Reports/reportList";
import RevenueByClientReport from "./Reports/revenueByClient";
import TimeEntryReports from "./Reports/timeEntry";
import TotalHoursReport from "./Reports/totalHoursLogged";
import PlanSelection from "./Subscriptions/PlanSelection";

const ClientsRoutes = [
  { path: "" ,Component: ClientList },
  { path: ":clientId" ,Component: ClientDetails }
];

const ReportsRoutes = [
  { path: "" ,Component: ReportList },
  { path: "time-entry" ,Component: TimeEntryReports },
  { path: "revenue-by-client" ,Component: RevenueByClientReport },
  { path: "outstanding-overdue-invoice" ,Component: OutstandingInvoiceReport },
  { path: "total-hours" ,Component: TotalHoursReport }
];

const InvoicesRoutes = [
  { path: "" , Component: InvoicesList },
  { path: "generate" ,Component: GenerateInvoices },
  { path: ":id/edit" ,Component: EditInvoice },
  { path: ":id" ,Component: Invoice },
  { path: "*" ,Component: ErrorPage }
];

const ProjectsRoutes = [
  { path: "" ,Component: ProjectList },
  { path: ":projectId" ,Component: ProjectDetails },
  { path: "*" ,Component: ErrorPage }
];

const SubscriptionsRoutes = [
  { path: "" ,Component: PlanSelection },
  { path: "*" ,Component: ErrorPage }
];

const PaymentsRoutes = [
  { path: "" ,Component: Payments },
  { path: "*" ,Component: ErrorPage }
];

const ROUTES = [
  { path: "clients" ,subRoutes: ClientsRoutes, authorisedRoles: ["admin","owner", "employee"] },
  { path: "invoices" ,subRoutes: InvoicesRoutes, authorisedRoles: ["admin","owner", "book_keeper"] },
  { path: "reports" ,subRoutes: ReportsRoutes, authorisedRoles: ["admin","owner"] },
  { path: "projects" ,subRoutes: ProjectsRoutes, authorisedRoles: ["admin","owner", "employee"] },
  { path: "subscriptions" ,subRoutes: SubscriptionsRoutes, authorisedRoles: ["admin","owner"] },
  { path: "payments" ,subRoutes: PaymentsRoutes, authorisedRoles: ["admin","owner", "book_keeper"] }
];

export default ROUTES;

import ErrorPage from "common/Error";
import EmailVerification from "components/Authentication/EmailVerification";
import EmailVerificationSuccess from "components/Authentication/EmailVerification/EmailVerificationSuccess";
import ForgotPassword from "components/Authentication/ForgotPassword";
import SignIn from "components/Authentication/SignIn";
import SignUp from "components/Authentication/SignUp";
import AccountsAgingReport from "components/Reports/AccountsAgingReport";
import TeamsRouteConfig from "components/Team/TeamsRouteConfig";
import { Roles, Paths } from "constants/index";

import ClientDetails from "../components/Clients/Details";
import ClientList from "../components/Clients/List";
import EditInvoice from "../components/Invoices/Edit";
import GenerateInvoices from "../components/Invoices/Generate";
import Invoice from "../components/Invoices/Invoice";
import InvoicesList from "../components/Invoices/List";
import Payments from "../components/payments";
import ProfileLayout from "../components/Profile/Layout";
import ProjectDetails from "../components/Projects/Details";
import ProjectList from "../components/Projects/List";
import ReportList from "../components/Reports/List";
import OutstandingInvoiceReport from "../components/Reports/OutstandingInvoiceReport";
import RevenueByClientReport from "../components/Reports/RevenueByClientReport";
import TimeEntryReports from "../components/Reports/TimeEntryReport";
import TotalHoursReport from "../components/Reports/totalHoursLogged";
import PlanSelection from "../components/Subscriptions/PlanSelection";
import RouteConfig from "../components/Team/RouteConfig";
import TimeTracking from "../components/TimeTracking";

const ClientsRoutes = [
  { path: "", Component: ClientList },
  { path: ":clientId", Component: ClientDetails },
];

const ReportsRoutes = [
  { path: "", Component: ReportList },
  { path: "time-entry", Component: TimeEntryReports },
  { path: "revenue-by-client", Component: RevenueByClientReport },
  { path: "outstanding-overdue-invoice", Component: OutstandingInvoiceReport },
  { path: "total-hours", Component: TotalHoursReport },
  { path: "accounts-aging", Component: AccountsAgingReport },
];

const InvoicesRoutes = [
  { path: "", Component: InvoicesList },
  { path: "generate", Component: GenerateInvoices },
  { path: ":id/edit", Component: EditInvoice },
  { path: ":id", Component: Invoice },
  { path: "*", Component: ErrorPage },
];

const ProjectsRoutes = [
  { path: "", Component: ProjectList },
  { path: ":projectId", Component: ProjectDetails },
  { path: "*", Component: ErrorPage },
];

const SubscriptionsRoutes = [
  { path: "", Component: PlanSelection },
  { path: "*", Component: ErrorPage },
];

const PaymentsRoutes = [
  { path: "", Component: Payments },
  { path: "*", Component: ErrorPage },
];

const TimeTrackingRoutes = [
  { path: "", Component: TimeTracking },
  { path: "*", Component: ErrorPage },
];

const TeamRoutes = [{ path: "*", Component: RouteConfig }];

const TeamsRoutes = [{ path: "*", Component: TeamsRouteConfig }];

const ProfileRoutes = [{ path: "*", Component: ProfileLayout }];

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE } = Roles;

export const AUTH_ROUTES = [
  {
    path: "/",
    component: SignIn,
  },
  {
    path: "/signup",
    component: SignUp,
  },
  {
    path: "/login",
    component: SignIn,
  },
  {
    path: "/password/new",
    component: ForgotPassword,
  },
  {
    path: "/email_confirmation",
    component: EmailVerification,
  },
  {
    path: "/email_confirmed",
    component: EmailVerificationSuccess,
  },
];

export const ROUTES = [
  {
    path: Paths.CLIENTS,
    subRoutes: ClientsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.INVOICES,
    subRoutes: InvoicesRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: Paths.REPORTS,
    subRoutes: ReportsRoutes,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: Paths.PROJECTS,
    subRoutes: ProjectsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.SUBSCRIPTIONS,
    subRoutes: SubscriptionsRoutes,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: Paths.PAYMENTS,
    subRoutes: PaymentsRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: Paths.TIME_TRACKING,
    subRoutes: TimeTrackingRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER],
  },
  {
    path: Paths.TEAMS,
    subRoutes: TeamsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.TEAM,
    subRoutes: TeamRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.PROFILE,
    subRoutes: ProfileRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
];

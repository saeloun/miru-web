import { Roles, Paths } from "constants/index";

import ErrorPage from "common/Error";
import EmailVerification from "components/Authentication/EmailVerification";
import EmailVerificationSuccess from "components/Authentication/EmailVerification/EmailVerificationSuccess";
import ForgotPassword from "components/Authentication/ForgotPassword";
import SignIn from "components/Authentication/SignIn";
import SignUp from "components/Authentication/SignUp";
import ExpenseDetails from "components/Expenses/Details";
import ExpensesTable from "components/Expenses/ExpensesTable";
import InvoiceEmail from "components/InvoiceEmail";
import MercuryInvoicesRouteConfig from "components/Invoices/MercuryRouteConfig";
import LeaveManagement from "components/LeaveManagement";
import Success from "components/payments/Success";
import ProfileRouteConfig from "components/Profile/Layout/RouteConfig";
import ProjectsTable from "components/Projects/ProjectsTable";
import AccountsAgingReport from "components/Reports/AccountsAgingReport";
import InvalidLink from "components/Team/List/InvalidLink";
import TeamsRouteConfig from "components/Team/TeamsRouteConfig";

import ClientsTable from "../components/Clients/ClientsTable";
import ClientDetails from "../components/Clients/Details";
import DashboardHome from "../components/Dashboard/DashboardHome";
import Payments from "../components/payments";
import ProjectDetails from "../components/Projects/Details";
import ReportsTable from "../components/Reports/ReportsTable";
import OutstandingInvoiceReport from "../components/Reports/OutstandingInvoiceReport";
import RevenueByClientReport from "../components/Reports/RevenueByClientReport";
import TimeEntryReports from "../components/Reports/TimeEntryReport";
import TotalHoursReport from "../components/Reports/totalHoursLogged";
import PlanSelection from "../components/Subscriptions/PlanSelection";
import TimeTracking from "../components/TimeTracking";

const DashboardRoutes = [
  { path: "", Component: DashboardHome },
  { path: "*", Component: ErrorPage },
];

const ClientsRoutes = [
  { path: "", Component: ClientsTable },
  { path: ":clientId", Component: ClientDetails },
];

const ReportsRoutes = [
  { path: "", Component: ReportsTable },
  { path: "time-entry", Component: TimeEntryReports },
  { path: "revenue-by-client", Component: RevenueByClientReport },
  { path: "outstanding-overdue-invoice", Component: OutstandingInvoiceReport },
  { path: "total-hours", Component: TotalHoursReport },
  { path: "accounts-aging", Component: AccountsAgingReport },
];

const ProjectsRoutes = [
  { path: "", Component: ProjectsTable },
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

const LeaveManagementRoutes = [
  { path: "leaves", Component: LeaveManagement },
  { path: "*", Component: ErrorPage },
];

const TeamRoutes = [{ path: "*", Component: TeamsRouteConfig }];

const InvoiceRoutes = [{ path: "*", Component: MercuryInvoicesRouteConfig }];

const SettingsRoutes = [{ path: "*", Component: ProfileRouteConfig }];

const ExpenseRoutes = [
  { path: "", Component: ExpensesTable },
  { path: ":expenseId", Component: ExpenseDetails },
  { path: "*", Component: ErrorPage },
];

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT } = Roles;

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
  {
    path: "/invalid-link",
    component: InvalidLink,
  },
];

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

export const ROUTES = [
  {
    path: Paths.DASHBOARD,
    subRoutes: DashboardRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER, CLIENT],
  },
  {
    path: Paths.CLIENTS,
    subRoutes: ClientsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.INVOICES,
    subRoutes: InvoiceRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, CLIENT],
  },
  {
    path: Paths.REPORTS,
    subRoutes: ReportsRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
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
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.TEAM,
    subRoutes: TeamRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.SETTINGS,
    subRoutes: SettingsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER, CLIENT],
  },
  {
    path: Paths.EXPENSES,
    subRoutes: ExpenseRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];

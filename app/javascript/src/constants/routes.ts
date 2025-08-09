import { Roles, Paths } from "constants/index";

import ErrorPage from "common/Error";
import EmailVerification from "components/Authentication/EmailVerification";
import EmailVerificationSuccess from "components/Authentication/EmailVerification/EmailVerificationSuccess";
import ForgotPassword from "components/Authentication/ForgotPassword";
import SignIn from "components/Authentication/SignIn";
import SignUp from "components/Authentication/SignUp";
import ExpenseDetails from "components/Expenses/Details";
import Expenses from "components/Expenses/List";
import InvoiceEmail from "components/InvoiceEmail";
import InvoicesRouteConfig from "components/Invoices/InvoicesRouteConfig";
import LeaveManagement from "components/LeaveManagement";
import Success from "components/payments/Success";
import ProfileRouteConfig from "components/Profile/Layout/RouteConfig";
import Projects from "components/Projects";
import AccountsAgingReport from "components/Reports/AccountsAgingReport";
import InvalidLink from "components/Team/List/InvalidLink";
import TeamsRouteConfig from "components/Team/TeamsRouteConfig";

import Clients from "../components/Clients";
import ClientDetails from "../components/Clients/Details";
import Payments from "../components/payments";
import ProjectDetails from "../components/Projects/Details";
import ReportList from "../components/Reports/List";
import OutstandingInvoiceReport from "../components/Reports/OutstandingInvoiceReport";
import RevenueByClientReport from "../components/Reports/RevenueByClientReport";
import TimeEntryReports from "../components/Reports/TimeEntryReport";
import TotalHoursReport from "../components/Reports/totalHoursLogged";
import PlanSelection from "../components/Subscriptions/PlanSelection";
import TimesheetEntries from "../components/TimesheetEntries";

const ClientsRoutes = [
  { path: "", Component: Clients },
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

const ProjectsRoutes = [
  { path: "", Component: Projects },
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
  { path: "", Component: TimesheetEntries },
  { path: "*", Component: ErrorPage },
];

const LeaveManagementRoutes = [
  { path: "", Component: LeaveManagement },
  { path: "*", Component: ErrorPage },
];

const TeamRoutes = [{ path: "*", Component: ProfileRouteConfig }];

const TeamsRoutes = [{ path: "*", Component: TeamsRouteConfig }];

const InvoiceRoutes = [{ path: "*", Component: InvoicesRouteConfig }];

const SettingsRoutes = [{ path: "*", Component: ProfileRouteConfig }];

const ExpenseRoutes = [
  { path: "", Component: Expenses },
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
    path: Paths.SETTINGS,
    subRoutes: SettingsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER, CLIENT],
  },
  {
    path: Paths.EXPENSES,
    subRoutes: ExpenseRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: Paths.Leave_Management,
    subRoutes: LeaveManagementRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
];

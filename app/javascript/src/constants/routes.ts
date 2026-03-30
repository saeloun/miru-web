import { Roles, Paths } from "constants/index";
import React, { lazy } from "react";

import ErrorPage from "common/Error";
import EmailVerification from "components/Authentication/EmailVerification";
import EmailVerificationSuccess from "components/Authentication/EmailVerification/EmailVerificationSuccess";
import ForgotPassword from "components/Authentication/ForgotPassword";
import ResetPassword from "components/Authentication/ResetPassword";
import SignIn from "components/Authentication/SignIn";
import SignUp from "components/Authentication/SignUp";
import InvoiceEmail from "components/InvoiceEmail";
import Success from "components/payments/Success";
import InvalidLink from "components/Team/List/InvalidLink";
import ReportsAccessGate from "../components/Reports/AccessGate";

const DashboardHome = lazy(
  () => import("../components/Dashboard/DashboardHome")
);
const ClientsTable = lazy(() => import("../components/Clients/ClientsTable"));
const ClientDetails = lazy(() => import("../components/Clients/Details"));
const ExpenseDetails = lazy(() => import("components/Expenses/Details"));
const ExpensesTable = lazy(() => import("components/Expenses/ExpensesTable"));
const InvoicesRouteConfig = lazy(
  () => import("components/Invoices/RouteConfig")
);
const LeaveManagement = lazy(() => import("components/LeaveManagement"));
const ProfileRouteConfig = lazy(
  () => import("components/Profile/Layout/RouteConfig")
);
const ProjectsTable = lazy(() => import("components/Projects/ProjectsTable"));
const ProjectDetails = lazy(() => import("../components/Projects/Details"));
const AccountsAgingReport = lazy(
  () => import("components/Reports/AccountsAgingReport")
);
const TeamsRouteConfig = lazy(() => import("components/Team/TeamsRouteConfig"));
const PaymentsTable = lazy(
  () => import("../components/payments/PaymentsTable")
);
const ReportsTable = lazy(() => import("../components/Reports/ReportsTable"));
const OutstandingInvoiceReport = lazy(
  () => import("../components/Reports/OutstandingInvoiceReport")
);

const RevenueByClientReport = lazy(
  () => import("../components/Reports/RevenueByClientReport")
);

const TimeEntryReports = lazy(
  () => import("../components/Reports/TimeEntryReport")
);

const TotalHoursReport = lazy(
  () => import("../components/Reports/totalHoursLogged")
);

const PaymentReport = lazy(
  () => import("../components/Reports/PaymentReport/CleanPaymentReport")
);

const PlanSelection = lazy(
  () => import("../components/Subscriptions/PlanSelection")
);
const TimeTracking = lazy(() => import("../components/TimeTracking"));

const withReportsGate = Component => props =>
  React.createElement(
    ReportsAccessGate,
    null,
    React.createElement(Component, props)
  );

const DashboardRoutes = [
  { path: "", Component: DashboardHome },
  { path: "*", Component: ErrorPage },
];

const ClientsRoutes = [
  { path: "", Component: ClientsTable },
  { path: ":clientId", Component: ClientDetails },
];

const ReportsRoutes = [
  { path: "", Component: withReportsGate(ReportsTable) },
  { path: "time-entry", Component: withReportsGate(TimeEntryReports) },
  {
    path: "revenue-by-client",
    Component: withReportsGate(RevenueByClientReport),
  },
  {
    path: "outstanding-overdue-invoices",
    Component: withReportsGate(OutstandingInvoiceReport),
  },
  {
    path: "outstanding-overdue-invoice",
    Component: withReportsGate(OutstandingInvoiceReport),
  },
  { path: "total-hours", Component: withReportsGate(TotalHoursReport) },
  { path: "accounts-aging", Component: withReportsGate(AccountsAgingReport) },
  { path: "payments", Component: withReportsGate(PaymentReport) },
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
  { path: "", Component: PaymentsTable },
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

const MyLeavesRoutes = [
  { path: "", Component: LeaveManagement },
  { path: "*", Component: ErrorPage },
];

const TeamRoutes = [{ path: "*", Component: TeamsRouteConfig }];

const InvoiceRoutes = [{ path: "*", Component: InvoicesRouteConfig }];

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
    path: "/password/edit",
    component: ResetPassword,
  },
  {
    path: "/users/password/edit",
    component: ResetPassword,
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
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: Paths.CLIENTS,
    subRoutes: ClientsRoutes,
    authorisedRoles: [ADMIN, OWNER],
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
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: Paths.SETTINGS,
    subRoutes: SettingsRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE, BOOK_KEEPER, CLIENT],
  },
  {
    path: Paths.MY_LEAVES,
    subRoutes: MyLeavesRoutes,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: Paths.EXPENSES,
    subRoutes: ExpenseRoutes,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
];

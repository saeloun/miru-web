import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

// Lazy load all components for better performance
const Dashboard = React.lazy(() => import("../components/Dashboard"));
const DashboardHome = React.lazy(
  () => import("../components/Dashboard/DashboardHome")
);

const ClientsTable = React.lazy(
  () => import("../components/Clients/ClientsTable")
);
const ClientDetails = React.lazy(() => import("../components/Clients/Details"));
const ProjectsTable = React.lazy(
  () => import("../components/Projects/ProjectsTable")
);

const ProjectDetails = React.lazy(
  () => import("../components/Projects/Details")
);
const InvoicesTable = React.lazy(() => import("../components/Invoices/List"));
const InvoiceDetails = React.lazy(
  () => import("../components/Invoices/Invoice")
);

const TimeTrackingTable = React.lazy(
  () => import("../components/TimesheetEntries/TimeTrackingTable")
);
const TeamTable = React.lazy(() => import("../components/Team/TeamTable"));
const ExpensesTable = React.lazy(
  () => import("../components/Expenses/ExpensesTable")
);

const ExpenseDetails = React.lazy(
  () => import("../components/Expenses/Details")
);

const ReportsTable = React.lazy(
  () => import("../components/Reports/ReportsTable")
);

const PaymentsTable = React.lazy(
  () => import("../components/Payments/PaymentsTable")
);
const Profile = React.lazy(() => import("../components/Profile"));
const Preferences = React.lazy(
  () => import("../components/Settings/Preferences")
);
const SignIn = React.lazy(() => import("../components/Authentication/SignIn"));
const SignUp = React.lazy(() => import("../components/Authentication/SignUp"));
const ForgotPassword = React.lazy(
  () => import("../components/Authentication/ForgotPassword")
);

// Create router configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: "dashboard",
        element: <DashboardHome />,
      },
      {
        path: "clients",
        children: [
          {
            index: true,
            element: <ClientsTable />,
          },
          {
            path: ":clientId",
            element: <ClientDetails />,
          },
        ],
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: <ProjectsTable />,
          },
          {
            path: ":projectId",
            element: <ProjectDetails />,
          },
        ],
      },
      {
        path: "invoices",
        children: [
          {
            index: true,
            element: <InvoicesTable />,
          },
          {
            path: ":invoiceId",
            element: <InvoiceDetails />,
          },
        ],
      },
      {
        path: "time-tracking",
        element: <TimeTrackingTable />,
      },
      {
        path: "team",
        element: <TeamTable />,
      },
      {
        path: "expenses",
        children: [
          {
            index: true,
            element: <ExpensesTable />,
          },
          {
            path: ":expenseId",
            element: <ExpenseDetails />,
          },
        ],
      },
      {
        path: "reports",
        element: <ReportsTable />,
      },
      {
        path: "payments",
        element: <PaymentsTable />,
      },
      {
        path: "settings",
        children: [
          {
            index: true,
            element: <Profile />,
          },
          {
            path: "preferences",
            element: <Preferences />,
          },
          {
            path: "*",
            element: <Profile />,
          },
        ],
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "/user/sign_in",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/password/new",
    element: <ForgotPassword />,
  },
]);

// Export a Router component
export const AppRouter: React.FC = () => (
  <React.Suspense
    fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }
  >
    <RouterProvider router={router} />
  </React.Suspense>
);

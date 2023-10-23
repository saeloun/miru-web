import AccountsAgingReport from "components/Reports/AccountsAgingReport";
import ReportList from "components/Reports/List";
import OutstandingInvoiceReport from "components/Reports/OutstandingInvoiceReport";
import RevenueByClientReport from "components/Reports/RevenueByClientReport";
import TimeEntryReports from "components/Reports/TimeEntryReport";
import TotalHoursReport from "components/Reports/totalHoursLogged";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER } = Roles;

export const ReportsRoutes = [
  {
    path: "/reports",
    Component: ReportList,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/reports/time-entry",
    Component: TimeEntryReports,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/reports/revenue-by-client",
    Component: RevenueByClientReport,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/reports/outstanding-overdue-invoice",
    Component: OutstandingInvoiceReport,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/reports/total-hours",
    Component: TotalHoursReport,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/reports/accounts-aging",
    Component: AccountsAgingReport,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];

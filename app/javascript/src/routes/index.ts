import { AUTH_ROUTES } from "./auth";
import { ClientRoutes } from "./clients";
import { InvoiceRoutes } from "./invoices";
import { PaymentsRoutes } from "./payments";
import { ProjectsRoutes } from "./projects";
import { PUBLIC_ROUTES } from "./public";
import { ReportsRoutes } from "./reports";
import { SettingsRoutes, SettingsSubRoutes } from "./settings";
import { TeamRoutes, TeamSubRoutes } from "./team";
import { TimeTrackingRoutes } from "./timetracking";

export { AUTH_ROUTES, PUBLIC_ROUTES, TeamSubRoutes, SettingsSubRoutes };

export const ROUTES = [
  ...ClientRoutes,
  ...TimeTrackingRoutes,
  ...ProjectsRoutes,
  ...InvoiceRoutes,
  ...ReportsRoutes,
  ...PaymentsRoutes,
  ...TeamRoutes,
  ...SettingsRoutes,
];

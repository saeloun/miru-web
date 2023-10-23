import TimeTracking from "components/TimeTracking";
import { Roles } from "constants/index";

const { ADMIN, OWNER, EMPLOYEE } = Roles;

export const TimeTrackingRoutes = [
  {
    path: "/time-tracking",
    Component: TimeTracking,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
];

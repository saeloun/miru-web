import Clients from "components/Clients";
import ClientDetails from "components/Clients/Details";
import { Roles } from "constants/index";

const { ADMIN, OWNER, EMPLOYEE } = Roles;

export const ClientRoutes = [
  {
    path: "/",
    Component: Clients,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: ":clientId",
    Component: ClientDetails,
    authorisedRoles: [ADMIN, OWNER],
  },
];

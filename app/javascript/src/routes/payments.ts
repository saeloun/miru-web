import Payments from "components/payments";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER } = Roles;

export const PaymentsRoutes = [
  {
    path: "/payments",
    Component: Payments,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];

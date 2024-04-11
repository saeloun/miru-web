import { Roles } from "constants/index";

import MobileNav from "./Layout/MobileNav";
import OrgDetails from "./Organization/Details";
import OrgEdit from "./Organization/Edit";
import Holidays from "./Organization/Holidays";
import Leaves from "./Organization/Leaves";
import PaymentSettings from "./Organization/Payment";
import AllocatedDevicesDetails from "./UserDetail/AllocatedDevicesDetails";
import AllocatedDevicesEdit from "./UserDetail/AllocatedDevicesDetails/Edit";
import CompensationDetails from "./UserDetail/CompensationDetails";
import CompensationDetailsEdit from "./UserDetail/CompensationDetails/Edit";
import UserDetailsEdit from "./UserDetail/Edit";
import EmploymentDetails from "./UserDetail/EmploymentDetails";
import EmploymentDetailsEdit from "./UserDetail/EmploymentDetails/Edit";
import UserDetailsView from "./UserDetail/UserDetailsView";

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT } = Roles;

export const SETTINGS_ROUTES = [
  {
    path: "/profile",
    Component: UserDetailsView,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
  },
  {
    path: "/profile/edit",
    Component: UserDetailsEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
  },
  {
    path: "/employment",
    Component: EmploymentDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/employment/edit",
    Component: EmploymentDetailsEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/devices",
    Component: AllocatedDevicesDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/devices/edit",
    Component: AllocatedDevicesEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/compensation",
    Component: CompensationDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/compensation/edit",
    Component: CompensationDetailsEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    path: "/",
    Component: MobileNav,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
  },
  {
    path: "/organization",
    Component: OrgDetails,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: "/organization/edit",
    Component: OrgEdit,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: "/payment",
    Component: PaymentSettings,
    authorisedRoles: [ADMIN, OWNER],
  },
  // {
  //   path: "/import",
  //   Component: OrganizationImport,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
  // {
  //   path: "/billing",
  //   Component: Billing,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
  {
    path: "/leaves",
    Component: Leaves,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    path: "/holidays",
    Component: Holidays,
    authorisedRoles: [ADMIN, OWNER],
  },
  // {
  //   path: "/integrations",
  //   Component: GoogleCalendar,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
];

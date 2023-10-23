import Layout from "components/Profile/Layout";
import MobileNav from "components/Profile/Layout/MobileNav";
import OrgDetails from "components/Profile/Organization/Details";
import OrgEdit from "components/Profile/Organization/Edit";
import PaymentSettings from "components/Profile/Organization/Payment";
import AllocatedDevicesDetails from "components/Profile/UserDetail/AllocatedDevicesDetails";
import UserDetailsEdit from "components/Profile/UserDetail/Edit";
import EmploymentDetails from "components/Profile/UserDetail/EmploymentDetails";
import EmploymentDetailsEdit from "components/Profile/UserDetail/EmploymentDetails/Edit";
import UserDetailsView from "components/Profile/UserDetail/UserDetailsView";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT } = Roles;

export const SettingsRoutes = [
  {
    path: "/settings/*",
    Component: Layout,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
  },
];

export const SettingsSubRoutes = [
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
    path: "/",
    Component: MobileNav,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
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
  // {
  //   path: "/leaves",
  //   Component: Leaves,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
  // {
  //   path: "/holidays",
  //   Component: Holidays,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
  // {
  //   path: "/leave-balance",
  //   Component: LeaveBalance,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
  // {
  //   path: "/integrations",
  //   Component: GoogleCalendar,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
];

import React from "react";

import {
  UserIcon,
  ProjectsIcon,
  MobileIcon,
  PaymentsIcon,
  CalendarIcon,
  CakeIcon,
  ClientsIcon,
} from "miruIcons";

import OrgDetails from "components/Profile/Organization/Details";
import OrgEdit from "components/Profile/Organization/Edit";
import Holidays from "components/Profile/Organization/Holidays";
import Leaves from "components/Profile/Organization/Leaves";
import PaymentSettings from "components/Profile/Organization/Payment";
import AllocatedDevicesDetails from "components/Profile/Personal/Devices";
import AllocatedDevicesEdit from "components/Profile/Personal/Devices/Edit";
import EmploymentDetails from "components/Profile/Personal/Employment";
import EmploymentDetailsEdit from "components/Profile/Personal/Employment/Edit";
import UserDetailsView from "components/Profile/Personal/User";
import UserDetailsEdit from "components/Profile/Personal/User/Edit";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT } = Roles;

export const SETTINGS = [
  {
    label: "PROFILE SETTINGS",
    path: "profile",
    icon: <UserIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
    Component: UserDetailsView,
    category: "personal",
    isTab: true,
  },
  {
    label: "PROFILE SETTINGS",
    path: "profile/edit",
    icon: <UserIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
    Component: UserDetailsEdit,
    category: "personal",
    isTab: false,
  },
  {
    label: "EMPLOYMENT DETAILS",
    path: "employment",
    icon: <ProjectsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: EmploymentDetails,
    category: "personal",
    isTab: true,
  },
  {
    label: "EMPLOYMENT DETAILS",
    path: "employment/edit",
    icon: <ProjectsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: EmploymentDetailsEdit,
    category: "personal",
    isTab: false,
  },
  {
    label: "ALLOCATED DEVICES",
    path: "devices",
    icon: <MobileIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: AllocatedDevicesDetails,
    category: "personal",
    isTab: true,
  },
  {
    label: "ALLOCATED DEVICES",
    path: "devices/edit",
    icon: <MobileIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: AllocatedDevicesEdit,
    category: "personal",
    isTab: false,
  },
  // Uncomment when Integrating with API
  // {
  //   label: "COMPENSATION",
  //   path: "compensation",
  //   icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
  //   authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  //   Component: CompensationDetails,
  //   category: "personal",
  //isTab: false,
  //},
  // {
  //   label: "COMPENSATION",
  //   path: "compensation/edit",
  //   icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
  //   authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  //   Component: CompensationDetailsEdit,
  //   category: "personal",
  // isTab: false,
  //},
  {
    label: "ORG. SETTINGS",
    path: "organization",
    icon: <ClientsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: OrgDetails,
    category: "organization",
    isTab: true,
  },
  {
    label: "ORG. SETTINGS",
    path: "organization/edit",
    icon: <ClientsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: OrgEdit,
    category: "organization",
    isTab: false,
  },
  {
    label: "PAYMENT SETTINGS",
    path: "payment",
    icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: PaymentSettings,
    category: "organization",
    isTab: true,
  },
  {
    label: "LEAVES",
    path: "leaves",
    icon: <CalendarIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: Leaves,
    category: "organization",
    isTab: true,
  },
  {
    label: "HOLIDAYS",
    path: "holidays",
    icon: <CakeIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: Holidays,
    category: "organization",
    isTab: true,
  },
  // Uncomment when Integrating with API
  // {
  //   label: "Integration",
  //   path: "/integrations",
  //   icon: <IntegrateIcon className="mr-2" size={20} weight="bold" />,
  //   authorisedRoles: [ADMIN, OWNER],
  //   Component: GoogleCalendar,
  //   category: "organization",
  // isTab: false,
  // },
  // {
  //   path: "/import",
  //   Component: OrganizationImport,
  //   authorisedRoles: [ADMIN, OWNER],
  //   category: "organization",
  // isTab: false,
  // },
  // {
  //   path: "/billing",
  //   Component: Billing,
  //   authorisedRoles: [ADMIN, OWNER],
  //   category: "organization",
  //isTab: false,
  // },
];

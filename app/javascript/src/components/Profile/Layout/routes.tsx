import { Roles } from "constants/index";

import React from "react";

import OrgDetails from "components/Profile/Organization/Details";
import BankInfo from "components/Profile/Organization/BankInfo";
import OrgEdit from "components/Profile/Organization/Edit";
import Holidays from "components/Profile/Organization/Holidays";
import Billing from "components/Profile/Organization/Billing";
import PaymentSettings from "components/Profile/Organization/Payment";
import AllocatedDevicesDetails from "components/Profile/Personal/Devices";
import AllocatedDevicesEdit from "components/Profile/Personal/Devices/Edit";
import EmploymentDetails from "components/Profile/Personal/Employment";
import EmploymentDetailsEdit from "components/Profile/Personal/Employment/Edit";
import NotificationPreferences from "components/Profile/Personal/NotificationPreferences";
import PreferencesPage from "components/Settings/ModernPreferences";
import Automation from "components/Profile/Personal/Automation";
import UserDetailsView from "components/Profile/Personal/User";
import UserDetailsEdit from "components/Profile/Personal/User/Edit";
import LeaveManagement from "components/LeaveManagement";
import {
  UserIcon,
  ProjectsIcon,
  MobileIcon,
  PaymentsIcon,
  CalendarIcon,
  CakeIcon,
  ClientsIcon,
  ReminderIcon,
} from "miruIcons";

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
  {
    label: "NOTIFICATION SETTINGS",
    path: "notifications",
    icon: <ReminderIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: NotificationPreferences,
    category: "personal",
    isTab: true,
  },
  {
    label: "PREFERENCES",
    path: "preferences",
    icon: <ReminderIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
    Component: PreferencesPage,
    category: "personal",
    isTab: false,
  },
  {
    label: "AUTOMATION & CLI",
    path: "automation",
    icon: <MobileIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
    Component: Automation,
    category: "personal",
    isTab: true,
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
    label: "BANK & TAX INFO",
    path: "bank-info",
    icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: BankInfo,
    category: "organization",
    isTab: false,
  },
  {
    label: "LEAVES",
    path: "leaves",
    icon: <CalendarIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
    Component: LeaveManagement,
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
    label: "BILLING",
    path: "billing",
    icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
    Component: Billing,
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
];

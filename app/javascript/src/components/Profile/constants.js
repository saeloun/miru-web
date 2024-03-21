import React from "react";

import {
  ClientsIcon as BuildingsIcon,
  CalendarIcon,
  CakeIcon,
  PaymentsIcon,
  UserIcon,
  MobileIcon,
  ProjectsIcon,
} from "miruIcons";

import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT } = Roles;

export const personalSettingsList = [
  {
    label: "PROFILE SETTINGS",
    link: "/settings/profile",
    icon: <UserIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE, CLIENT],
  },
  {
    label: "EMPLOYMENT DETAILS",
    link: "/settings/employment",
    icon: <ProjectsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  {
    label: "ALLOCATED DEVICES",
    link: "/settings/devices",
    icon: <MobileIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  },
  //TODO: Uncomment when Integrating with API
  // {
  //   label: "COMPENSATION",
  //   link: "/settings/compensation",
  //   icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
  //   authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER, EMPLOYEE],
  // },
];

export const companySettingsList = [
  {
    label: "ORG. SETTINGS",
    link: "/settings/organization",
    icon: <BuildingsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    label: "PAYMENT SETTINGS",
    link: "/settings/payment",
    icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    label: "LEAVES",
    link: "/settings/leaves",
    icon: <CalendarIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
  },
  {
    label: "HOLIDAYS",
    link: "/settings/holidays",
    icon: <CakeIcon className="mr-2" size={20} weight="bold" />,
    authorisedRoles: [ADMIN, OWNER],
  },
  // {
  //   label: "Integration",
  //   link: "/settings/integrations",
  //   icon: <IntegrateIcon className="mr-2" size={20} weight="bold" />,
  //   authorisedRoles: [ADMIN, OWNER],
  // },
];

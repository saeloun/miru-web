import React from "react";

import {
  ClientsIcon as BuildingsIcon,
  PaymentsIcon,
  // CalendarIcon,
  // CakeIcon,
  UserIcon,
  // IntegrateIcon,
  MobileIcon,
  ProjectsIcon,
} from "miruIcons";

export const personalSettingsList = [
  {
    label: "PROFILE SETTINGS",
    link: "/profile/edit",
    icon: <UserIcon className="mr-2" size={20} weight="bold" />,
  },
  {
    label: "EMPLOYMENT DETAILS",
    link: "/profile/employment-details",
    icon: <ProjectsIcon className="mr-2" size={20} weight="bold" />,
  },
  {
    label: "ALLOCATED DEVICES",
    link: "/profile/devices-details",
    icon: <MobileIcon className="mr-2" size={20} weight="bold" />,
  },
];

export const companySettingsList = [
  {
    label: "ORG. SETTINGS",
    link: "/profile/edit/organization-details",
    icon: <BuildingsIcon className="mr-2" size={20} weight="bold" />,
  },
  {
    label: "PAYMENT SETTINGS",
    link: "/profile/edit/payment",
    icon: <PaymentsIcon className="mr-2" size={20} weight="bold" />,
  },
  // {
  //   label: "LEAVES",
  //   link: "/profile/edit/leaves",
  //   icon: <CalendarIcon className="mr-2" size={20} weight="bold" />,
  // },
  // {
  //   label: "HOLIDAYS",
  //   link: "/profile/edit/holidays",
  //   icon: <CakeIcon className="mr-2" size={20} weight="bold" />,
  // },
  // {
  //   label: "Integration",
  //   link: "/profile/edit/integrations",
  //   icon: <IntegrateIcon className="mr-2" size={20} weight="bold" />,
  // },
];

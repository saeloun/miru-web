import React from "react";

import {
  TimeTrackingIcon,
  ClientsIcon,
  TeamsIcon,
  ProjectsIcon,
  ReportsIcon,
  InvoicesIcon,
  PaymentsIcon,
} from "miruIcons";
import { NavLink } from "react-router-dom";

import { Paths } from "constants/index";

const navEmployeeOptions = [
  {
    logo: <TimeTrackingIcon className="mr-0 md:mr-4" size={26} />,
    label: "Time Tracking",
    path: Paths.TIME_TRACKING,
  },
  {
    logo: <ClientsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Clients",
    path: Paths.CLIENTS,
  },
  {
    logo: <ProjectsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Projects",
    path: Paths.PROJECTS,
  },
];

const navAdminOptions = [
  ...navEmployeeOptions,
  {
    logo: <TeamsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Team",
    path: Paths.TEAMS,
  },
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    path: Paths.INVOICES,
  },
  {
    logo: <ReportsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Reports",
    path: Paths.REPORTS,
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Payments",
    path: Paths.PAYMENTS,
  },
];

const navAdminMobileOptions = [
  {
    logo: <TimeTrackingIcon className="mr-0 md:mr-4" size={26} />,
    label: "Time Tracking",
    path: Paths.TIME_TRACKING,
  },
  {
    logo: <TeamsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Team",
    path: Paths.TEAMS,
  },
  {
    logo: <ClientsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Clients",
    path: Paths.CLIENTS,
  },
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    path: Paths.INVOICES,
  },
  {
    logo: <ProjectsIcon className="mr-4" size={26} />,
    label: "Projects",
    path: Paths.PROJECTS,
  },
  {
    logo: <ReportsIcon className="mr-4" size={26} />,
    label: "Reports",
    path: Paths.REPORTS,
  },
  {
    logo: <PaymentsIcon className="mr-4" size={26} />,
    label: "Payments",
    path: Paths.PAYMENTS,
  },
];

const activeClassName =
  "w-full py-3 px-2 md:px-4 flex items-center justify-center md:justify-start text-miru-han-purple-1000 bg-miru-gray-100  border-l-0 md:border-l-8 border-miru-han-purple-1000 font-extrabold";

const mobileActiveClassName =
  "flex flex-col items-center justify-center text-miru-han-purple-1000 text-xs font-bold";

const getMobileListClassName = (isActive, index, showMoreOptions) => {
  if (isActive && !showMoreOptions) return mobileActiveClassName;

  if (index > 3) {
    return "w-full px-4 flex items-center justify-start hover:bg-miru-gray-100";
  }

  return "w-full flex flex-col items-center justify-center hover:bg-miru-gray-100 text-xs font-medium";
};

const ListOption = ({ option, index }) => (
  <li className="items-center hover:bg-miru-gray-100" key={index}>
    <NavLink
      to={option.path}
      className={({ isActive }) =>
        isActive
          ? activeClassName
          : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6"
      }
    >
      {option.logo} {option.label}
    </NavLink>
  </li>
);

const MobileListOption = ({
  from,
  index,
  option,
  setSelectedTab,
  showMoreOptions,
}) => (
  <li
    className="flex items-center justify-start border-b border-miru-gray-100 py-3 text-base font-medium leading-5 last:border-b-0"
    key={index}
    onClick={() => setSelectedTab(option.label)}
  >
    <NavLink
      to={option.path}
      className={({ isActive }) =>
        getMobileListClassName(isActive, from, showMoreOptions)
      }
    >
      {option.logo} <span className="text-center">{option.label}</span>
    </NavLink>
  </li>
);

const getEmployeeOptions = () =>
  navEmployeeOptions.map((option, index) => (
    <ListOption index={index} key={index} option={option} />
  ));

const getAdminOptions = () =>
  navAdminOptions.map((option, index) => (
    <ListOption index={index} key={index} option={option} />
  ));

const MobileMenuOptions = ({
  isAdminUser,
  setSelectedTab,
  from,
  to,
  showMoreOptions,
}) => {
  if (isAdminUser) {
    return (
      <>
        {navAdminMobileOptions.slice(from, to).map((option, index) => (
          <MobileListOption
            from={from}
            index={index}
            key={index}
            option={option}
            setSelectedTab={setSelectedTab}
            showMoreOptions={showMoreOptions}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {navEmployeeOptions.slice(from, to).map((option, index) => (
        <MobileListOption
          from={from}
          index={index}
          key={index}
          option={option}
          setSelectedTab={setSelectedTab}
          showMoreOptions={showMoreOptions}
        />
      ))}
    </>
  );
};

export {
  navEmployeeOptions,
  navAdminOptions,
  navAdminMobileOptions,
  activeClassName,
  mobileActiveClassName,
  ListOption,
  MobileListOption,
  MobileMenuOptions,
  getAdminOptions,
  getEmployeeOptions,
};

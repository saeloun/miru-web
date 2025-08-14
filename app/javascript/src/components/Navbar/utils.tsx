import { Paths, LocalStorageKeys } from "constants/index";

import React from "react";

import { logoutApi } from "apis/logoutApi";
import {
  TimeTrackingIcon,
  ClientsIcon,
  TeamsIcon,
  ProjectsIcon,
  ReportsIcon,
  InvoicesIcon,
  PaymentsIcon,
  SettingIcon,
  CalendarIcon,
  CoinsIcon,
} from "miruIcons";
import { NavLink } from "react-router-dom";

const navOptions = [
  {
    logo: <TimeTrackingIcon className="mr-0 md:mr-4" size={26} />,
    label: "Time Tracking",
    path: Paths.TIME_TRACKING,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    logo: <ClientsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Clients",
    path: Paths.CLIENTS,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    logo: <ProjectsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Projects",
    path: Paths.PROJECTS,
    allowedRoles: ["admin", "employee", "owner"],
  },
  {
    logo: <TeamsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Team",
    path: Paths.TEAM.replace("/*", ""),
    allowedRoles: ["admin", "owner"],
  },
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    path: "/invoices",
    allowedRoles: ["admin", "owner", "book_keeper", "client"],
  },
  {
    logo: <ReportsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Reports",
    path: Paths.REPORTS,
    allowedRoles: ["admin", "owner", "book_keeper"],
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Payments",
    path: Paths.PAYMENTS,
    allowedRoles: ["admin", "owner", "book_keeper"],
  },
  {
    logo: <CalendarIcon className="mr-0 md:mr-4" size={26} />,
    label: "Leaves & Holidays",
    path: Paths.Leave_Management,
    allowedRoles: ["admin", "owner", "employee"],
  },
  {
    logo: <CoinsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Expenses",
    path: Paths.EXPENSES,
    allowedRoles: ["admin", "owner", "book_keeper"],
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
    path: Paths.TEAM.replace("/*", ""),
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
  {
    logo: <CoinsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Expenses",
    dataCy: "expenses-tab",
    path: Paths.EXPENSES,
  },
];

const navClientOptions = [
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    path: "/invoices",
    allowedRoles: ["admin", "owner", "book_keeper", "client"],
  },
  {
    logo: <SettingIcon className="mr-0 md:mr-4" size={26} />,
    label: "Settings",
    path: Paths.SETTINGS.replace("/*", "/profile"),
    allowedRoles: ["admin", "owner", "book_keeper", "client"],
  },
  {
    logo: <CoinsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Expenses",
    dataCy: "expenses-tab",
    path: Paths.EXPENSES,
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

const getNavOptions = companyRole =>
  navOptions.map((option, index) => {
    if (option.allowedRoles.includes(companyRole)) {
      return <ListOption index={index} key={index} option={option} />;
    }
  });

const MobileMenuOptions = ({
  companyRole,
  setSelectedTab,
  from,
  to,
  showMoreOptions,
}) => (
  <>
    {navOptions
      .slice(from, to)
      .map(
        (option, index) =>
          option.allowedRoles.includes(companyRole) && (
            <MobileListOption
              from={from}
              index={index}
              key={index}
              option={option}
              setSelectedTab={setSelectedTab}
              showMoreOptions={showMoreOptions}
            />
          )
      )}
  </>
);

const handleLogout = async () => {
  try {
    // Call Rails logout API
    await logoutApi();

    // Clear local storage
    Object.values(LocalStorageKeys).forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear auth token
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");

    // Redirect to home/login page
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout API fails, clear local storage and redirect
    Object.values(LocalStorageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    window.location.href = "/";
  }
};

export {
  navAdminMobileOptions,
  activeClassName,
  mobileActiveClassName,
  ListOption,
  MobileListOption,
  MobileMenuOptions,
  getNavOptions,
  navOptions,
  navClientOptions,
  handleLogout,
};

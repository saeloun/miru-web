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

export const navEmployeeOptions = [
  {
    logo: <TimeTrackingIcon className="mr-0 md:mr-4" size={26} />,
    label: "Time Tracking",
    dataCy: "time-tracking-tab",
    path: Paths.TIME_TRACKING,
  },
  {
    logo: <TeamsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Team",
    dataCy: "team-tab",
    path: Paths.TEAM,
  },
  {
    logo: <ClientsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Clients",
    dataCy: "clients-tab",
    path: Paths.CLIENTS,
  },
  {
    logo: <ProjectsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Projects",
    dataCy: "projects-tab",
    path: Paths.PROJECTS,
  },
];

export const navAdminOptions = [
  ...navEmployeeOptions,
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    dataCy: "invoices-tab",
    path: Paths.INVOICES,
  },
  {
    logo: <ReportsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Reports",
    dataCy: "reports-tab",
    path: Paths.REPORTS,
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Payments",
    dataCy: "payments-tab",
    path: Paths.PAYMENTS,
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Expenses",
    dataCy: "expenses-tab",
    path: Paths.EXPENSES,
  },
];

export const navAdminMobileOptions = [
  {
    logo: <InvoicesIcon className="mr-0 md:mr-4" size={26} />,
    label: "Invoices",
    dataCy: "invoices-tab",
    path: Paths.INVOICES,
  },
  ...navEmployeeOptions,
  {
    logo: <ReportsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Reports",
    dataCy: "reports-tab",
    path: Paths.REPORTS,
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Payments",
    dataCy: "payments-tab",
    path: Paths.PAYMENTS,
  },
  {
    logo: <PaymentsIcon className="mr-0 md:mr-4" size={26} />,
    label: "Expenses",
    dataCy: "expenses-tab",
    path: Paths.EXPENSES,
  },
];

export const activeClassName =
  "w-full py-3 px-2 md:px-4 flex items-center justify-center md:justify-start text-miru-han-purple-1000 bg-miru-gray-100  border-l-0 md:border-l-8 border-miru-han-purple-1000 font-extrabold";
export const mobileActiveClassName =
  "flex flex-col items-center justify-center text-miru-han-purple-1000 font-bold text-xs";

export const ListOption = ({ option, key }) => (
  <li className="items-center hover:bg-miru-gray-100" key={key}>
    <NavLink
      data-cy={option.dataCy}
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

export const MobileListOption = ({ option, key, setSelectedTab }) => (
  <li
    className="flex items-center justify-center p-2 hover:bg-miru-gray-100"
    key={key}
    onClick={() => setSelectedTab(option.label)}
  >
    <NavLink
      data-cy={option.dataCy}
      to={option.path}
      className={({ isActive }) =>
        isActive
          ? mobileActiveClassName
          : "flex flex-col items-center justify-center text-xs hover:bg-miru-gray-100"
      }
    >
      {option.logo} {option.label}
    </NavLink>
  </li>
);

export const getEmployeeOptions = () =>
  navEmployeeOptions.map((option, index) => (
    <ListOption key={index} option={option} />
  ));

export const getAdminOptions = () =>
  navAdminOptions.map((option, index) => (
    <ListOption key={index} option={option} />
  ));

export const MobileMenuOptions = ({
  isAdminUser,
  setSelectedTab,
  from,
  to,
}) => {
  if (isAdminUser) {
    return (
      <>
        {navAdminMobileOptions.slice(from, to).map((option, index) => (
          <MobileListOption
            key={index}
            option={option}
            setSelectedTab={setSelectedTab}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {navEmployeeOptions.slice(from, to).map((option, index) => (
        <MobileListOption
          key={index}
          option={option}
          setSelectedTab={setSelectedTab}
        />
      ))}
    </>
  );
};

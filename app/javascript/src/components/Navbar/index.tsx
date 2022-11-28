/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";

// eslint-disable-next-line import/order
import {
  TimeTrackingIcon,
  TeamsIcon,
  ClientsIcon,
  ProjectsIcon,
  SettingIcon,
  SignOutIcon,
  ReportsIcon,
  InvoicesIcon,
  PaymentsIcon,
} from "miruIcons";
import { NavLink, Link } from "react-router-dom";

import { Paths } from "constants/index";

const miruLogo = require("../../../../assets/images/PurpleMiruLogoWithText.svg"); //eslint-disable-line
const avatar = require("../../../../assets/images/NavAvatar.svg"); //eslint-disable-line

const Navbar = ({ isAdminUser, user }) => {
  const [isDesktop, setIsDesktop] = useState(innerWidth > 650);

  useEffect(() => {
    window.addEventListener("resize", () => setIsDesktop(innerWidth > 650));
    window.removeEventListener("resize", () => setIsDesktop(innerWidth > 650));
  }, [innerWidth]);

  const navEmployeeOptions = [
    {
      logo: <TimeTrackingIcon className="mr-0 md:mr-4" size={26} />,
      label: "Time Tracking",
      dataCy: "time-tracking-tab",
      path: Paths.TIME_TRACKING,
    },
    {
      logo: <ClientsIcon className="mr-0 md:mr-4" size={26} />,
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

  const navAdminOptions = [
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
  ];

  const activeClassName =
    "flex py-3 md:px-4 px-2 items-center md:justify-start justify-center text-miru-han-purple-1000 bg-miru-gray-100  border-l-0 md:border-l-8 border-miru-han-purple-1000 font-extrabold";

  const getEmployeeOptions = () =>
    navEmployeeOptions.map((option, index) => (
      <li className="items-center hover:bg-miru-gray-100" key={index}>
        <NavLink
          data-cy={option.dataCy}
          to={option.path}
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6"
          }
        >
          {option.logo} {isDesktop && option.label}
        </NavLink>
      </li>
    ));

  const getAdminOption = () =>
    navAdminOptions.map((option, index) => (
      <li
        className="items-center justify-center hover:bg-miru-gray-100 md:justify-start"
        key={index}
      >
        <NavLink
          data-cy={option.dataCy}
          to={option.path}
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6"
          }
        >
          {option.logo} {isDesktop && option.label}
        </NavLink>
      </li>
    ));

  return (
    <div className="fixed top-0 bottom-0 left-0 flex h-full w-1/6 flex-col justify-between shadow-2xl ">
      <div>
        <div className="flex h-20 items-center justify-center bg-miru-gray-100">
          <Link to={Paths.TIME_TRACKING}>
            <img alt="miru-logo" src={miruLogo} />
          </Link>
        </div>
        <ul className="mt:auto md:mt-8">
          {isAdminUser ? getAdminOption() : getEmployeeOptions()}
        </ul>
      </div>
      <div>
        <ul className="mt:auto md:mt-32">
          {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Bell size={26} className="mr-0 md:mr-4" /> Notification
            </li>
          </a> */}
          <li className="flex items-center justify-center hover:bg-miru-gray-100 md:justify-start">
            <NavLink
              to="/profile/edit"
              className={({ isActive }) =>
                isActive
                  ? activeClassName
                  : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6"
              }
            >
              <SettingIcon className="mr-0 md:mr-4" size={26} />
              {isDesktop && "Settings"}
            </NavLink>
          </li>
          {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Question size={26} className="mr-0 md:mr-4" /> Help
            </li>
          </a> */}
          <a data-method="delete" href="/users/sign_out" rel="nofollow">
            <li className="flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6">
              <SignOutIcon className="mr-0 md:mr-4" size={26} />
              {isDesktop && "Logout"}
            </li>
          </a>
        </ul>
        <div className="overflow-XIcon-auto mt-auto flex h-16 w-full items-center bg-miru-gray-100 p-4 md:mt-6">
          <img alt="avatar" className="mr-2" src={avatar} />
          <div className="overflow-XIcon-auto flex flex-col">
            <span className="pt-1 text-base font-bold leading-5">{`${user.first_name} ${user.last_name}`}</span>
            <span className="text-xs font-normal leading-4">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

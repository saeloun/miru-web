/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";

import { Paths } from "constants/index";

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
  PaymentsIcon

} from "miruIcons";
import { NavLink, Link } from "react-router-dom";

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
      logo: <TimeTrackingIcon size={26} className="mr-0 md:mr-4" />,
      label: "Time Tracking",
      dataCy: "time-tracking-tab",
      path: Paths.TIME_TRACKING
    },
    {
      logo: <ClientsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Team",
      dataCy: "team-tab",
      path: Paths.TEAM
    },
    {
      logo: <ClientsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Clients",
      dataCy: "clients-tab",
      path: Paths.CLIENTS
    },
    {
      logo: <ProjectsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Projects",
      dataCy: "projects-tab",
      path: Paths.PROJECTS
    }
  ];

  const navAdminOptions = [
    {
      logo: <TimeTrackingIcon size={26} className="mr-0 md:mr-4" />,
      label: "Time Tracking",
      dataCy: "time-tracking-tab",
      path: Paths.TIME_TRACKING
    },
    {
      logo: <TeamsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Team",
      dataCy: "team-tab",
      path: Paths.TEAM
    },
    {
      logo: <ClientsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Clients",
      dataCy: "clients-tab",
      path: Paths.CLIENTS
    },
    {
      logo: <ProjectsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Projects",
      dataCy: "projects-tab",
      path: Paths.PROJECTS
    },
    {
      logo: <InvoicesIcon size={26} className="mr-0 md:mr-4" />,
      label: "Invoices",
      dataCy: "invoices-tab",
      path: Paths.INVOICES
    },
    {
      logo: <ReportsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Reports",
      dataCy: "reports-tab",
      path: Paths.REPORTS
    },
    {
      logo: <PaymentsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Payments",
      dataCy: "payments-tab",
      path: Paths.PAYMENTS
    }
  ];

  const activeClassName =
    "flex py-3 md:px-4 px-2 items-center md:justify-start justify-center text-miru-han-purple-1000 bg-miru-gray-100  border-l-0 md:border-l-8 border-miru-han-purple-1000 font-extrabold";

  const getEmployeeOptions = () =>
    navEmployeeOptions.map((option, index) => (
      <li key={index} className="items-center hover:bg-miru-gray-100">
        <NavLink
          to={option.path}
          data-cy={option.dataCy}
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100"
          }
        >
          {option.logo} {isDesktop && option.label}
        </NavLink>
      </li>
    ));

  const getAdminOption = () =>
    navAdminOptions.map((option, index) => (
      <li
        key={index}
        className="items-center md:justify-start justify-center hover:bg-miru-gray-100"
      >
        <NavLink
          to={option.path}
          data-cy={option.dataCy}
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100"
          }
        >
          {option.logo} {isDesktop && option.label}
        </NavLink>
      </li>
    ));

  return (
    <div className="fixed top-0 bottom-0 left-0 shadow-2xl w-1/6 h-full flex flex-col justify-between ">
      <div>
        <div className="h-20 bg-miru-gray-100 flex items-center justify-center">
          <Link to={Paths.TIME_TRACKING}>
            <img src={miruLogo} alt="miru-logo" />
          </Link>
        </div>
        <ul className="md:mt-8 mt:auto">
          {isAdminUser ? getAdminOption() : getEmployeeOptions()}
        </ul>
      </div>
      <div>
        <ul className="md:mt-32 mt:auto">
          {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Bell size={26} className="mr-0 md:mr-4" /> Notification
            </li>
          </a> */}
          <li className="flex items-center md:justify-start justify-center hover:bg-miru-gray-100">
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? activeClassName
                  : "flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100"
              }
              to="/profile/edit"
            >
              <SettingIcon size={26} className="mr-0 md:mr-4" />
              {isDesktop && "Settings"}
            </NavLink>
          </li>
          {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Question size={26} className="mr-0 md:mr-4" /> Help
            </li>
          </a> */}
          <a data-method="delete" href="/users/sign_out" rel="nofollow">
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <SignOutIcon size={26} className="mr-0 md:mr-4" />
              {isDesktop && "Logout"}
            </li>
          </a>
        </ul>
        <div className="md:mt-6 mt-auto w-full h-16 p-4 bg-miru-gray-100 flex items-center overflow-XIcon-auto">
          <img src={avatar} className="mr-2" alt="avatar" />
          <div className="flex flex-col overflow-XIcon-auto">
            <span className="font-bold text-base leading-5 pt-1">{`${user.first_name} ${user.last_name}`}</span>
            <span className="font-normal text-xs leading-4">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

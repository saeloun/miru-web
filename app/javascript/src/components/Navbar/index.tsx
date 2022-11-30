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
  PaymentsIcon,
  SpaceIcon,
  TackleIcon,
  LeadIcon,
  EngagementIcon,
  RecruitmentIcon
} from "miruIcons";
import { NavLink, Link } from "react-router-dom";

import "./style.scss";

const brandLogo = require("../../../../assets/images/brand/ac-logo.svg"); //eslint-disable-line
const avatar = require("../../../../assets/images/NavAvatar.svg"); //eslint-disable-line

const Navbar = ({ isAdminUser, user, permissions }) => {
  const [isDesktop, setIsDesktop] = useState(false); // innerWidth > 650

  // useEffect(() => {
  //   window.addEventListener("resize", () => setIsDesktop(innerWidth > 650));
  //   window.removeEventListener("resize", () => setIsDesktop(innerWidth > 650));
  // }, [innerWidth]);

  const navEmployeeOptions = [
    {
      logo: <SpaceIcon size={26} className="mr-0 md:mr-4" />,
      label: "Spaces",
      dataCy: "spaces-tab",
      path: Paths.SPACES
    },
    {
      logo: <TackleIcon size={26} className="mr-0 md:mr-4" />,
      label: "TackLe",
      dataCy: "devices-tab",
      path: Paths.DEVICES
    },
    permissions.engagementsDashboard ? {
      logo: <EngagementIcon size={26} className="mr-0 md:mr-4" />,
      label: "Engagements",
      dataCy: "engagements-tab",
      path: Paths.ENGAGEMENTS_DASHBOARD,
      permissionId: 'engagementsDashboard'
    } : {
      logo: <EngagementIcon size={26} className="mr-0 md:mr-4" />,
      label: "Engagements",
      dataCy: "engagements-tab",
      path: Paths.ENGAGEMENTS,
      permissionId: 'engagements'
    },
    {
      logo: <LeadIcon size={26} className="mr-0 md:mr-4" />,
      label: "Leads",
      dataCy: "leads-tab",
      path: Paths.LEADS,
      permissionId: 'leads'
    },
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
    // {
    //   logo: <ClientsIcon size={26} className="mr-0 md:mr-4" />,
    //   label: "Clients",
    //   dataCy: "clients-tab",
    //   path: Paths.CLIENTS
    // },
    {
      logo: <ProjectsIcon size={26} className="mr-0 md:mr-4" />,
      label: "Projects",
      dataCy: "projects-tab",
      path: Paths.PROJECTS
    }
  ];

  const navAdminOptions = [
    {
      logo: <SpaceIcon size={26} className="mr-0 md:mr-4" />,
      label: "Spaces",
      dataCy: "spaces-tab",
      path: Paths.SPACES
    },
    {
      logo: <TackleIcon size={26} className="mr-0 md:mr-4" />,
      label: "TackLe",
      dataCy: "devices-tab",
      path: Paths.DEVICES
    },
    {
      logo: <EngagementIcon size={26} className="mr-0 md:mr-4" />,
      label: "Engagements",
      dataCy: "engagements-tab",
      path: Paths.ENGAGEMENTS_DASHBOARD
    },
    {
      logo: <LeadIcon size={26} className="mr-0 md:mr-4" />,
      label: "Leads",
      dataCy: "leads-tab",
      path: Paths.LEADS
    },
    {
      logo: <RecruitmentIcon size={26} className="mr-0 md:mr-4" />,
      label: "Recruitment",
      dataCy: "recruitment-tab",
      path: Paths.RECRUITMENT
    },
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
    `flex py-3 px-2 items-center text-miru-han-purple-1000 bg-miru-gray-100 border-miru-han-purple-1000 font-extrabold ${isDesktop ? 'justify-start border-l-8' : 'justify-center border-l-0'}`
  const inActiveClassName =
    `flex py-3 px-2 items-center hover:bg-miru-gray-100 ${isDesktop ? 'justify-start border-l-8' : 'justify-center border-l-0'}`

  const getEmployeeOptions = () =>
    navEmployeeOptions.map((option, index) => {
      if (option.permissionId && permissions[option.permissionId] === false) return

      return (<li key={index} className="items-center hover:bg-miru-gray-100">
        <NavLink
          to={option.path}
          data-cy={option.dataCy}
          className={({ isActive }) => isActive ? activeClassName : inActiveClassName }
        >
          <span title={option.label}>{option.logo}</span> {isDesktop && option.label}
        </NavLink>
      </li>)
    });

  const getAdminOption = () =>
    navAdminOptions.map((option, index) => (<li key={index} className="items-center hover:bg-miru-gray-100">
      <NavLink
        to={option.path}
        data-cy={option.dataCy}
        className={({ isActive }) => isActive ? activeClassName : inActiveClassName }
      >
        {option.logo} {isDesktop && option.label}
      </NavLink>
    </li>));

  return (
    <div className={`sidebar fixed top-0 bottom-0 left-0 shadow-2xl h-full flex flex-col justify-between ${isDesktop ? '' : 'collapse-sidebar'}`}>
      <div className="h-30 bg-miru-gray-100 flex items-center justify-center py-3 relative">
        <Link to={Paths.SPACES}>
          <img className="h-4" src={brandLogo} alt="ac-logo" />
        </Link>
        <div className="toggle-menu" onClick={() =>  setIsDesktop(!isDesktop)}>
          {isDesktop ? '<' : '>'}
        </div>
      </div>
      <div className="ac-calendar-container overflow-y-auto">
        <ul className="md:mt-8 mt:auto">
          {isAdminUser ? getAdminOption() : getEmployeeOptions()}
        </ul>
      </div>
      <div>
        <ul className="md:mt-32 mt:auto">
          {/* <a>
            <li className={inActiveClassName}>
              <Bell size={26} className="mr-0 md:mr-4" /> Notification
            </li>
          </a> */}
          <li className="items-center hover:bg-miru-gray-100">
            <NavLink
              to="/profile/edit"
              className={({ isActive }) => isActive ? activeClassName : inActiveClassName }
            >
              <SettingIcon size={26} className="mr-0 md:mr-4" />
              {isDesktop && "Settings"}
            </NavLink>
          </li>
          {/* <a>
            <li className="flex py-3 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Question size={26} className="mr-0 md:mr-4" /> Help
            </li>
          </a> */}
          <a data-method="delete" href="/users/sign_out" rel="nofollow">
            <li className={inActiveClassName}>
              <SignOutIcon size={26} className="mr-0 md:mr-4" />
              {isDesktop && "Logout"}
            </li>
          </a>
        </ul>
        <div className="md:mt-6 mt-auto w-full h-16 p-3 bg-miru-gray-100 flex items-center overflow-XIcon-auto">
          <img src={avatar} className="mr-2" alt="avatar" />
          {isDesktop && <div className="flex flex-col overflow-XIcon-auto">
            <span className="font-bold text-base leading-5 pt-1">{`${user.first_name} ${user.last_name}`}</span>
            <span className="font-normal text-xs leading-4">{user.email}</span>
          </div> }
        </div>
      </div>
    </div>
  );
};

export default Navbar;

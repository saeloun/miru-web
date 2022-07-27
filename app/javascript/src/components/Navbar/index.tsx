import React from "react";
import { NavLink } from "react-router-dom";
import userApi from "apis/user";
import {
  Timer,
  Gauge,
  UsersThree,
  Buildings,
  Briefcase,
  Receipt,
  ChartLine,
  Wallet,
  Bell,
  Gear,
  Question,
  SignOut
} from "phosphor-react";

import { Paths } from "constants/index";
const miruLogo = require("../../../../assets/images/PurpleMiruLogoWithText.png"); //eslint-disable-line
const avatar = require("../../../../assets/images/NavAvatar.png"); //eslint-disable-line

const Navbar = ({ isAdminUser, user }) => {
  const navEmployeeOptions = [
    {
      logo: <Timer size={26} className="mr-4" />,
      label: "Time Tracking",
      path: Paths.TIME_TRACKING
    },
    {
      logo: <UsersThree size={26} className="mr-4" />,
      label: "Team",
      path: Paths.TEAM
    },
    {
      logo: <Buildings size={26} className="mr-4" />,
      label: "Clients",
      path: Paths.CLIENTS
    },
    {
      logo: <Briefcase size={26} className="mr-4" />,
      label: "Projects",
      path: Paths.PROJECTS
    }
  ];

  const navAdminOptions = [
    {
      logo: <Gauge size={26} className="mr-4" />,
      label: "Dashboard",
      path: ""
    },
    {
      logo: <Timer size={26} className="mr-4" />,
      label: "Time Tracking",
      path: Paths.TIME_TRACKING
    },
    {
      logo: <UsersThree size={26} className="mr-4" />,
      label: "Team",
      path: Paths.TEAM
    },
    {
      logo: <Buildings size={26} className="mr-4" />,
      label: "Clients",
      path: Paths.CLIENTS
    },
    {
      logo: <Briefcase size={26} className="mr-4" />,
      label: "Projects",
      path: Paths.PROJECTS
    },
    {
      logo: <Receipt size={26} className="mr-4" />,
      label: "Invoices",
      path: Paths.INVOICES
    },
    {
      logo: <ChartLine size={26} className="mr-4" />,
      label: "Reports",
      path: Paths.REPORTS
    },
    {
      logo: <Wallet size={26} className="mr-4" />,
      label: "Payments",
      path: Paths.PAYMENTS
    }
  ];

  const activeClassName =
    "flex py-3 px-4 items-center text-miru-han-purple-1000 bg-miru-gray-100 border-l-8 border-miru-han-purple-1000";

  const getEmployeeOptions = () => navEmployeeOptions.map((option) => (
    <li className="items-center hover:bg-miru-gray-100">
      <NavLink
        to={option.path}
        className={({ isActive }) =>
          isActive
            ? activeClassName
            : "flex py-3 px-6 items-center hover:bg-miru-gray-100"
        }
      >
        {option.logo} {option.label}
      </NavLink>
    </li>
  ));

  const getAdminOption = () => navAdminOptions.map((option) => (
    <li className="items-center hover:bg-miru-gray-100">
      <NavLink
        to={option.path}
        className={({ isActive }) =>
          isActive
            ? activeClassName
            : "flex py-3 px-6 items-center hover:bg-miru-gray-100"
        }
      >
        {option.logo} {option.label}
      </NavLink>
    </li>
  ));

  const handleSignOut = async () => {
    try {
      await userApi.destroy(user.id);
    } catch (err) {} // eslint-disable-line
  };

  return (
    <div className="shadow-2xl w-1/6 h-full flex flex-col justify-between ">
      <div>
        <div className="h-20 bg-miru-gray-100 flex items-center justify-center">
          <img src={miruLogo} />
        </div>
        <ul className="mt-8">
          {isAdminUser ? getAdminOption() : getEmployeeOptions()}
        </ul>
      </div>

      <div>
        <ul className="mt-32">
          <a>
            <li className="flex py-3 px-6 items-center hover:bg-miru-gray-100">
              <Bell size={26} className="mr-4" /> Notification
            </li>
          </a>
          <a href="/profile/edit">
            <li className="flex py-3 px-6 items-center hover:bg-miru-gray-100">
              <Gear size={26} className="mr-4" /> Setting
            </li>
          </a>
          <a>
            <li className="flex py-3 px-6 items-center hover:bg-miru-gray-100">
              <Question size={26} className="mr-4" /> Help
            </li>
          </a>
          <a>
            <li
              className="flex py-3 px-6 items-center hover:bg-miru-gray-100"
              onClick={handleSignOut}
            >
              <SignOut size={26} className="mr-4" /> Logout
            </li>
          </a>
        </ul>
        <div className="mr-2 w-full h-16 p-4 bg-miru-gray-100 flex items-center">
          <img src={avatar} className="mr-2" />
          <div className="flex flex-col overflow-x-auto">
            <span className="font-bold text-base leading-5 pt-1">{`${user.first_name} ${user.last_name}`}</span>
            <span className="font-normal text-xs leading-4">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

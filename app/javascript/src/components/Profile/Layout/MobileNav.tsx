/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";

import {
  ClientsIcon as BuildingsIcon,
  UserIcon,
  PaymentsIcon,
  ProjectsIcon,
  MobileIcon,
} from "miruIcons";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import WorkspaceApi from "apis/workspaces";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import { TeamUrl } from "./TeamUrl";
import { UserDetails } from "./UserDetails";

const getSettingsNavUrls = memberId => [
  {
    groupName: "Personal",
    navItems: [
      {
        url: "/settings/profile",
        text: "PERSONAL DETAILS",
        icon: <UserIcon size={16} />,
      },
      {
        url: "/settings/employment",
        text: "EMPLOYMENT DETAILS",
        icon: <ProjectsIcon size={16} />,
      },
      {
        url: "/settings/devices",
        text: "ALLOCATED DEVICES",
        icon: <MobileIcon size={16} />,
      },
      //Todo: Uncomment while API integration
      // {
      //   url: "/settings/compensation",
      //   text: "COMPENSATION",
      //   icon: <PaymentsIcon size={16} />,
      // },
    ],
  },

  {
    isCompanyDetails: true,
    navItems: [
      {
        url: "/settings/organization",
        text: "ORG. SETTINGS",
        icon: <BuildingsIcon size={16} />,
      },
      {
        url: "/settings/payment",
        text: "PAYMENT SETTINGS",
        icon: <PaymentsIcon size={16} />,
      },
      // {
      //   url: "/settings/leaves",
      //   text: "Leaves",
      //   icon: <CalendarIcon size={16} />,
      // },
      // {
      //   url: "/settings/holidays",
      //   text: "Holidays",
      //   icon: <CakeIcon size={16} />,
      // },
    ],
  },
];

const getEmployeeSettingsNavUrls = memberId => [
  {
    groupName: "Personal",
    navItems: [
      {
        url: "/settings/profile",
        text: "PERSONAL DETAILS",
        icon: <UserIcon size={16} />,
      },
      {
        url: "/settings/employment",
        text: "EMPLOYMENT DETAILS",
        icon: <ProjectsIcon size={16} />,
      },
      {
        url: "/settings/devices",
        text: "ALLOCATED DEVICES",
        icon: <MobileIcon size={16} />,
      },
      {
        url: "/settings/compensation",
        text: "COMPENSATION",
        icon: <PaymentsIcon size={16} />,
      },
    ],
  },
];

const MobileNav = () => {
  const { isAdminUser: isAdmin, isDesktop, user } = useUserContext();
  const { memberId } = useParams();
  const AdminUrlList = getSettingsNavUrls(memberId);
  const EmployeeUrlList = getEmployeeSettingsNavUrls(memberId);
  const navigate = useNavigate();
  const [currentWorkspace, setCurrentWorkspace] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getCurrentWorkspace = async () => {
    const res = await WorkspaceApi.get();
    const { workspaces } = res.data;
    workspaces.find(wrk => {
      if (wrk.id == user.current_workspace_id) {
        setCurrentWorkspace(wrk);
      }
    });
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getCurrentWorkspace();
  }, []);

  useEffect(() => {
    if (isDesktop) {
      navigate("/settings/profile");
    }
  }, [isDesktop]);

  const mobileView = () => (
    <div>
      <UserDetails />
      <TeamUrl
        currentWorkspaceName={currentWorkspace?.name || ""}
        urlList={isAdmin ? AdminUrlList : EmployeeUrlList}
      />
      <Outlet />
    </div>
  );

  const DisplayView = withLayout(mobileView, true, true);

  if (isLoading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
  }

  return <DisplayView />;
};

export default MobileNav;

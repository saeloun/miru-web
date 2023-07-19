/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";

import {
  ClientsIcon as BuildingsIcon,
  UserIcon,
  PaymentsIcon,
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
        url: "/profile/edit",
        text: "PERSONAL DETAILS",
        icon: <UserIcon size={16} />,
      },
    ],
  },

  {
    isCompanyDetails: true,
    navItems: [
      {
        url: "/profile/edit/organization-details",
        text: "ORG. SETTINGS",
        icon: <BuildingsIcon size={16} />,
      },
      {
        url: "/profile/edit/payment",
        text: "PAYMENT SETTINGS",
        icon: <PaymentsIcon size={16} />,
      },
    ],
  },
];

const getEmployeeSettingsNavUrls = memberId => [
  {
    groupName: "Personal",
    navItems: [
      {
        url: "/profile/edit",
        text: "PERSONAL DETAILS",
        icon: <UserIcon size={16} />,
      },
    ],
  },
];

const MobileNav = ({ isAdmin }) => {
  const { isDesktop, user } = useUserContext();
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
      navigate("/profile/edit");
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

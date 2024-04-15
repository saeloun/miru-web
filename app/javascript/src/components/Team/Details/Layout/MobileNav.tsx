/* eslint-disable no-unused-vars */

import React from "react";

import { UserIcon, ProjectsIcon, MobileIcon } from "miruIcons";
import { useParams } from "react-router-dom";

import withLayout from "common/Mobile/HOC/withLayout";

import { TeamUrl } from "./TeamUrl";
import { UserInformation } from "./UserInformation";

const getTeamUrls = memberId => [
  {
    url: `/team/${memberId}/details`,
    text: "PERSONAL DETAILS",
    icon: <UserIcon size={16} />,
  },
  {
    url: `/team/${memberId}/employment`,
    text: "EMPLOYMENT DETAILS",
    icon: <ProjectsIcon size={16} />,
  },
  {
    url: "/settings/devices",
    text: "ALLOCATED DEVICES",
    icon: <MobileIcon size={16} />,
  },
];

const MobileNav = () => {
  const { memberId } = useParams();
  const urlList = getTeamUrls(memberId);

  const mobileView = () => (
    <div>
      <UserInformation />
      <TeamUrl urlList={urlList} />
    </div>
  );

  const DisplayView = withLayout(mobileView, true, true);

  return <DisplayView />;
};

export default MobileNav;

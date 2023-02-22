/* eslint-disable no-unused-vars */

import React from "react";

import { useParams } from "react-router-dom";

import withLayout from "common/Mobile/HOC/withLayout";

import { TeamUrl } from "./TeamUrl";
import { UserInformation } from "./UserInformation";

const getTeamUrls = memberId => [
  {
    url: `/team/${memberId}/details`,
    text: "PERSONAL DETAILS",
  },
  // {
  //   url: `/team/${memberId}/employment`,
  //   text: "EMPLOYEMENT DETAILS", // TODO: fix spelling employment
  // },
  // {
  //   url: `/team/${memberId}/devices`,
  //   text: "ALLOCATED DEVICES",
  // },
  // {
  //   url: `/team/${memberId}/compensation`,
  //   text: "COMPENSATION",
  // },
  // {
  //   url: `/team/${memberId}/documents`,
  //   text: "DOCUMENTS",
  // },
  // {
  //   url: `/team/${memberId}/reimburstment`, // TODO: fix spelling reimbursement
  //   text: "REIMBURSEMENTS",
  // },
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

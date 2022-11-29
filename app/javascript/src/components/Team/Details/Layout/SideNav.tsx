import React from "react";

import { NavLink, useParams } from "react-router-dom";

const userAvatar = require("../../../../../../assets/images/user_avatar.svg"); //eslint-disable-line

const getActiveClassName = isActive => {
  if (isActive) {
    return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
  }

  return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
};

const getTeamUrls = memberId => [
  {
    url: `/team/${memberId}`,
    text: "PERSONAL DETAILS",
  },
  {
    url: `/team/${memberId}/employment`,
    text: "EMPLOYEMENT DETAILS",
  },
  {
    url: `/team/${memberId}/devices`,
    text: "ALLOCATED DEVICES",
  },
  {
    url: `/team/${memberId}/compensation`,
    text: "COMPENSATION",
  },
  {
    url: `/team/${memberId}/documents`,
    text: "DOCUMENTS",
  },
  {
    url: `/team/${memberId}/reimburstment`, // TODO: fix spelling reimbursement
    text: "REIMBURSEMENTS",
  },
];

const UserInformation = () => (
  <div>
    <div className="mr-2 flex h-20 w-60 items-center bg-miru-han-purple-1000 p-4 text-white" />
    <div className="mr-2 flex flex-col justify-center bg-miru-gray-100">
      <div className="relative flex h-12 justify-center">
        <div className="userAvatarWrapper">
          <img className="h-24 w-24" src={userAvatar} />
        </div>
      </div>
      <div className="mt-3 flex flex-col items-center justify-center border-b-8 border-miru-gray-200 pb-8">
        <span className="mb-1 text-xl font-bold text-miru-han-purple-1000">
          Jane Cooper
        </span>
        <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000">
          SENIOR SOFTWARE DEVELOPER
        </span>
      </div>
    </div>
  </div>
);

const TeamUrl = ({ urlList }) => (
  <div className="mr-2 mt-4 w-60 bg-miru-gray-100">
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      {urlList.map((item, index) => (
        <li className="border-b-2 border-miru-gray-400" key={index}>
          <NavLink
            end
            className={({ isActive }) => getActiveClassName(isActive)}
            to={item.url}
          >
            {item.text}
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const SideNav = () => {
  const { memberId } = useParams();
  const urlList = getTeamUrls(memberId);

  return (
    <div>
      <UserInformation />
      <TeamUrl urlList={urlList} />
    </div>
  );
};

export default SideNav;

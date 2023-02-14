/* eslint-disable no-unused-vars */

import React, { useEffect } from "react";

import { UserAvatarSVG } from "miruIcons";
import { NavLink, useParams } from "react-router-dom";
import { Tooltip } from "StyledComponents";

import teamsApi from "apis/teams";
import withLayout from "common/Mobile/HOC/withLayout";
import { useTeamDetails } from "context/TeamDetailsContext";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";

const getActiveClassName = isActive => {
  if (isActive) {
    return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
  }

  return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
};

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

const UserInformation = () => {
  const {
    details: { personalDetails },
    updateDetails,
  } = useTeamDetails();
  const { memberId } = useParams();
  const getDetails = async () => {
    const res: any = await teamsApi.get(memberId);
    const addRes = await teamsApi.getAddress(memberId);
    const teamsObj = teamsMapper(res.data, addRes.data.addresses[0]);
    updateDetails("personal", teamsObj);
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div>
      <div className="flex h-88 w-full flex-row items-center bg-miru-han-purple-1000 p-4 text-white">
        <div className="relative flex h-14 w-1/5 justify-center">
          <img className="h-14 w-14" src={UserAvatarSVG} />
        </div>
        <div className="flex w-4/5 flex-col items-baseline justify-center px-4">
          <Tooltip
            content={`${personalDetails.first_name} ${personalDetails.last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-xl font-bold text-white">
                {`${personalDetails.first_name} ${personalDetails.last_name}`}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};

const TeamUrl = ({ urlList }) => (
  <div className="h-screen w-full bg-white">
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

const MobileNav = () => {
  const { memberId } = useParams();
  const urlList = getTeamUrls(memberId);
  const { isDesktop } = useUserContext();

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

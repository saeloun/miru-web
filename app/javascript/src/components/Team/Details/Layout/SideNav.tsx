import React from "react";

import { UserAvatarSVG } from "miruIcons";
import { NavLink, useParams } from "react-router-dom";
import { Tooltip } from "StyledComponents";

import { useTeamDetails } from "context/TeamDetailsContext";

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
];

const UserInformation = () => {
  const {
    details: { personalDetails },
  } = useTeamDetails();

  return (
    <div>
      <div className="flex h-20 w-full items-center bg-miru-han-purple-1000 p-4 text-white" />
      <div className="flex flex-col justify-center bg-miru-gray-100">
        <div className="relative flex h-12 justify-center">
          <div className="userAvatarWrapper">
            <img className="h-24 w-24" src={UserAvatarSVG} />
          </div>
        </div>
        <div className="mt-3 flex flex-col items-center justify-center border-b-8 border-miru-gray-200 pb-8">
          <Tooltip
            content={`${personalDetails.first_name} ${personalDetails.last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className=" text-xl font-bold text-miru-han-purple-1000">
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
  <div className="mt-4 min-h-50v w-full bg-miru-gray-100">
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

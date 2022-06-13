import React from "react";
import { NavLink, useParams } from "react-router-dom";
const userAvatar = require("../../../../../../assets/images/user_avatar.svg"); //eslint-disable-line

const getActiveClassName = (isActive) => {
  if (isActive) {
    return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
  }
  return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
};

const getTeamUrls = (memberId) => [
  {
    url: `/team/${memberId}/`,
    text: "Personal Details"
  },
  {
    url: `/team/${memberId}/employment`,
    text: "Employment Details"
  }
];

const UserInformation = () => (
  <div>
    <div className="mr-2 w-60 h-20 p-4 bg-miru-han-purple-1000 flex text-white items-center">
    </div>
    <div className='bg-miru-gray-100 flex flex-col justify-center mr-2'>
      <div className="h-12 flex relative justify-center">
        <div className="userAvatarWrapper">
          <img src={userAvatar} className='w-24 h-24' />
        </div>
      </div>

      <div className='flex flex-col justify-center items-center mt-3 pb-8 border-b-8 border-miru-gray-200'>
        <span className='text-miru-han-purple-1000 text-xl font-bold mb-1'>Jane Cooper</span>
        <span className='text-miru-dark-purple-1000 text-xs tracking-wider leading-4'>SENIOR SOFTWARE DEVELOPER</span>
      </div>
    </div>
  </div>
);

const TeamUrl = ({ urlList }) => (
  <div className='mr-2 mt-4 w-60 bg-miru-gray-100'>
    <ul className='list-none text-sm font-medium leading-5 tracking-wider'>
      {
        urlList.map((item, index) => (
          <li className='border-b-2 border-miru-gray-400' key={index}>
            <NavLink end to={item.url} className={({ isActive }) => getActiveClassName(isActive)}>
              {item.text}
            </NavLink>
          </li>
        ))
      }
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

import React, { useState } from "react";

import { DeleteIcon, EditIcon, ImageIcon, UserAvatarSVG } from "miruIcons";
import { NavLink, useParams } from "react-router-dom";
import { Tooltip } from "StyledComponents";

import { useTeamDetails } from "context/TeamDetailsContext";
import teamApi from "apis/team";

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

const UserInformation = ({memberId}) => {
  const {
    details: {
      personalDetails: { first_name, last_name },
    },
  } = useTeamDetails();

  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const handleProfileImageChange = e => {
    setShowProfileOptions(false);
    const imageFile = e.target.files[0];
    const size = imageFile.size / 1024;
    if (size > 100) {
      setErrorMessage("Image size too big");
    } else {
      setImageUrl(URL.createObjectURL(imageFile));
      setErrorMessage("");
      const formD = new FormData();
      formD.append("user[avatar]", imageFile);
      teamApi.updateTeamMemberAvatar(memberId, formD);

    }
  };

  const handleDeleteProfileImage = () => {
    setImageUrl(null);
    teamApi.destroyTeamMemberAvatar(memberId);
  };

  return (
    <div>
      <div className="flex h-20 w-full items-center bg-miru-han-purple-1000 p-4 text-white" />
      <div className="flex flex-col justify-center bg-miru-gray-100">
        <div className="relative flex h-12 justify-center">
          <div className="userAvatarWrapper">
            <img
              className="h-88 w-88 rounded-full"
              src={imageUrl || UserAvatarSVG}
            />
            <button
              className="absolute right-0 bottom-0	flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-miru-han-purple-1000"
              onClick={() => setShowProfileOptions(!showProfileOptions)}
            >
              <EditIcon color="white" size={12} weight="bold" />
            </button>
          </div>
        </div>
        {errorMessage.length > 0 && (
          <span className="text-center text-sm text-miru-red-400">
            {errorMessage}
          </span>
        )}
        <div className="relative mt-3 flex flex-col items-center justify-center border-b-8 border-miru-gray-200 pb-8">
          {showProfileOptions && (
            <div className="absolute bottom--10 z-15 mx-auto mt-6 min-h-24	w-28 flex-col items-end rounded-lg bg-white p-2 shadow-c1	group-hover:flex">
              <label
                className="flex cursor-pointer flex-row items-center p-1.5 text-sm text-miru-han-purple-1000"
                htmlFor="file-input"
              >
                <ImageIcon color="#5B34EA" size={16} weight="bold" />
                <span className="pl-2">Upload</span>
              </label>
              <input
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                id="file-input"
                name="myImage"
                type="file"
                onChange={handleProfileImageChange}
              />
              <div
                className="flex cursor-pointer flex-row items-center p-1.5 text-sm text-miru-red-400"
                onClick={handleDeleteProfileImage}
              >
                <DeleteIcon color="#E04646" size={16} weight="bold" />
                <span className="pl-2">Delete</span>
              </div>
            </div>
          )}
          <Tooltip
            content={`${first_name} ${last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className=" text-xl font-bold text-miru-han-purple-1000">
                {`${first_name} ${last_name}`}
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
      <UserInformation memberId={memberId}/>
      <TeamUrl urlList={urlList} />
    </div>
  );
};

export default SideNav;

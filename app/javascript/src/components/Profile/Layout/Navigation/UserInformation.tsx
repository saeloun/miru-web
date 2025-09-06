import React, { useEffect, useState } from "react";

import { teamApi, teamsApi } from "apis/api";
import { useProfileContext } from "context/Profile/ProfileContext";
import { UserAvatarSVG, DeleteIcon, ImageIcon, EditIcon } from "miruIcons";
import { MoreOptions, Toastr, Tooltip } from "StyledComponents";
import { useCurrentUser } from "~/hooks/useCurrentUser";

const UserInformation = () => {
  const {
    personalDetails: { first_name, last_name, id },
    isCalledFromSettings,
  } = useProfileContext();
  const { currentUser } = useCurrentUser();

  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  // Use current user data when in settings context
  const displayName =
    isCalledFromSettings && currentUser
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : `${first_name} ${last_name}`;

  const userId = isCalledFromSettings && currentUser ? currentUser.id : id;

  const getAvatar = async () => {
    if (!userId) return;

    try {
      if (isCalledFromSettings && currentUser) {
        // Use current user avatar from _me endpoint
        setImageUrl(currentUser.avatar_url);
      } else {
        // Use teams API for team member context
        const responseData = await teamsApi.get(userId);
        setImageUrl(responseData.data.avatar_url);
      }
    } catch {
      Toastr.error("Error in getting Profile Image");
    }
  };

  useEffect(() => {
    if (userId) {
      getAvatar();
    }
  }, [userId, currentUser]);

  const validateFileSize = file => {
    const sizeInKB = file.size / 1024;
    if (sizeInKB > 100) {
      throw new Error("Image size needs to be less than 100 KB");
    }
  };

  const createFormData = file => {
    const formData = new FormData();
    formData.append("user[avatar]", file);

    return formData;
  };

  const handleProfileImageChange = async e => {
    try {
      setShowProfileOptions(false);
      const file = e.target.files[0];
      validateFileSize(file);
      setImageUrl(URL.createObjectURL(file));
      const payload = createFormData(file);
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      await teamApi.updateTeamMemberAvatar(userId, payload, { headers });
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      setShowProfileOptions(false);
      await teamApi.destroyTeamMemberAvatar(userId);
      setImageUrl(null);
    } catch {
      Toastr.error("Error in deleting Profile Image");
    }
  };

  return (
    <div>
      <div className="flex h-32 w-full items-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white rounded-t-xl shadow-lg" />
      <div className="flex flex-col justify-center bg-white rounded-b-xl">
        <div className="relative flex h-12 justify-center -mt-12">
          <div className="relative">
            <img
              className="h-24 w-24 rounded-full border-4 border-white shadow-xl object-cover"
              src={imageUrl || UserAvatarSVG}
            />
            <button
              className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md hover:scale-110 transition-transform duration-200"
              onClick={() => setShowProfileOptions(!showProfileOptions)}
            >
              <EditIcon color="white" size={16} weight="bold" />
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex flex-col items-center justify-center pb-6">
          {showProfileOptions && (
            <MoreOptions setVisibilty={setShowProfileOptions}>
              <li className="absolute bottom--10 z-15 mx-auto mt-6 min-h-24	w-28 flex-col items-end rounded-lg bg-white p-2 shadow-c1	group-hover:flex">
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
                {imageUrl && (
                  <li
                    className="flex cursor-pointer flex-row items-center p-1.5 text-sm text-miru-red-400"
                    onClick={handleDeleteProfileImage}
                  >
                    <DeleteIcon color="#E04646" size={16} weight="bold" />
                    <span className="pl-2">Delete</span>
                  </li>
                )}
              </li>
            </MoreOptions>
          )}
          <Tooltip
            content={displayName}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-2 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {displayName}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};

export default UserInformation;

/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";

import { DeleteIcon, EditIcon, ImageIcon, UserAvatarSVG } from "miruIcons";
import { MobileMoreOptions, Tooltip } from "StyledComponents";

import profileApi from "apis/profile";
import Toastr from "common/Toastr";
import { useProfile } from "components/Profile/context/EntryContext";
import { teamsMapper } from "mapper/teams.mapper";

export const UserDetails = () => {
  const { setUserState, profileSettings } = useProfile();
  const [showImageUpdateOptions, setShowImageUpdateOptions] =
    useState<boolean>(false);
  const [userImageUrl, setUserImageUrl] = useState<any>(null);

  const getDetails = async () => {
    try {
      if (!profileSettings.first_name && !profileSettings.last_name) {
        const data = await profileApi.index();
        if (data.status && data.status == 200) {
          const addressData = await profileApi.getAddress(data.data.user.id);
          const userObj = teamsMapper(
            data.data.user,
            addressData.data.addresses[0]
          );
          setUserState("profileSettings", userObj);
        }
      }
    } catch {
      Toastr.error("Something went wrong");
    }
  };

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
      setShowImageUpdateOptions(false);
      const file = e.target.files[0];
      validateFileSize(file);
      setUserImageUrl(URL.createObjectURL(file));
      const payload = createFormData(file);
      await profileApi.update(payload);
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    setShowImageUpdateOptions(false);
    await profileApi.removeAvatar();
    setUserImageUrl(null);
  };

  const getAvatar = async () => {
    const {
      data: {
        user: { avatar_url },
      },
    } = await profileApi.index();
    setUserImageUrl(avatar_url);
  };

  useEffect(() => {
    getAvatar();
    getDetails();
  }, []);

  return (
    <div>
      <div className="relative flex h-88 w-full flex-row items-center bg-miru-han-purple-1000 p-4 text-white">
        <div className="relative flex h-14 w-14 justify-center">
          <div>
            <img
              className="h-full w-full rounded-full object-cover"
              src={userImageUrl || UserAvatarSVG}
            />
            <button
              className="absolute right-0 bottom-0	flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-miru-white-1000"
              onClick={() => setShowImageUpdateOptions(true)}
            >
              <EditIcon color="#5B34EA" size={12} weight="bold" />
            </button>
          </div>
        </div>
        {showImageUpdateOptions ? (
          <MobileMoreOptions
            className="h-1/10 w-full md:mx-auto md:h-1/12 md:w-11/12"
            setVisibilty={setShowImageUpdateOptions}
          >
            <li className="w-full">
              <label
                className="flex w-full items-center gap-x-2 pb-5"
                htmlFor="org-profile-image-input"
              >
                <div>
                  <ImageIcon color="#5B34EA" size={16} />
                </div>
                <p className="font-manrope text-sm font-medium text-miru-han-purple-1000">
                  Upload
                </p>
              </label>
              <input
                className="hidden"
                id="org-profile-image-input"
                name="myImage"
                type="file"
                onChange={handleProfileImageChange}
              />
            </li>
            <li
              className="flex w-full items-center gap-x-2 pb-5"
              onClick={handleDeleteProfileImage}
            >
              <div>
                <DeleteIcon color="#E04646" size={15} />
              </div>
              <p className="font-manrope text-sm font-medium text-miru-red-400">
                Delete
              </p>
            </li>
          </MobileMoreOptions>
        ) : null}
        <div className="flex w-4/5 flex-col items-baseline justify-center px-4">
          <Tooltip
            content={`${profileSettings.first_name} ${profileSettings.last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-xl font-bold text-white">
                {`${profileSettings.first_name} ${profileSettings.last_name}`}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};
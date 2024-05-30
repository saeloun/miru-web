/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";

import { DeleteIcon, EditIcon, ImageIcon } from "miruIcons";
import { Avatar, MobileMoreOptions, Toastr, Tooltip } from "StyledComponents";

import profileApi from "apis/profile";
import teamsApi from "apis/teams";
import { useProfile } from "components/Profile/context/EntryContext";
import { useUserContext } from "context/UserContext";
import { employmentMapper, teamsMapper } from "mapper/teams.mapper";

export const UserDetails = () => {
  const { setUserState, profileSettings, employmentDetails } = useProfile();
  const { first_name, last_name } = profileSettings;
  const {
    current_employment: { designation },
  } = employmentDetails;

  const [showImageUpdateOptions, setShowImageUpdateOptions] =
    useState<boolean>(false);

  const { user, avatarUrl, setCurrentAvatarUrl, companyRole } =
    useUserContext();

  const getDetails = async () => {
    try {
      if (!first_name && !last_name) {
        const userData = await teamsApi.get(user.id);
        if (userData.status && userData.status == 200) {
          const addressData = await teamsApi.getAddress(user.id);

          const userObj = teamsMapper(
            userData.data,
            addressData.data.addresses[0]
          );
          setUserState("profileSettings", userObj);
        }

        if (companyRole !== "client" && !designation) {
          const employmentData: any = await teamsApi.getEmploymentDetails(
            user.id
          );

          const previousEmploymentData = await teamsApi.getPreviousEmployments(
            user.id
          );

          if (employmentData.status && employmentData.status == 200) {
            const employmentObj = employmentMapper(
              employmentData?.data?.employment,
              previousEmploymentData?.data?.previous_employments
            );
            setUserState("employmentDetails", employmentObj);
          }
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
      setCurrentAvatarUrl(URL.createObjectURL(file));
      const payload = createFormData(file);
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      await profileApi.updateAvatar(payload, { headers });
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    setShowImageUpdateOptions(false);
    await profileApi.removeAvatar();
    setCurrentAvatarUrl(null);
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div>
      <div className="relative flex h-88 w-full flex-row items-center bg-miru-han-purple-1000 p-4 text-white">
        <div className="relative flex h-14 w-14 justify-center">
          <div>
            <Avatar classNameImg="w-14 h-14" url={avatarUrl} />
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
            className="w-full md:mx-auto md:w-11/12"
            setVisibilty={setShowImageUpdateOptions}
            visibilty={showImageUpdateOptions}
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
                accept="image/png, image/jpeg, image/jpg"
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
            content={`${first_name} ${last_name}`}
            wrapperClassName="relative block max-w-full "
          >
            <div className="mb-1 max-w-full overflow-hidden truncate whitespace-nowrap px-4">
              <span className="text-xl font-bold text-white">
                {`${first_name} ${last_name}`}
              </span>
              <p className="mt-1 uppercase">{designation}</p>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-miru-dark-purple-1000" />
        </div>
      </div>
    </div>
  );
};

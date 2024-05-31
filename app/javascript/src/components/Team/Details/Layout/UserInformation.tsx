/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";

import { UserAvatarSVG, DeleteIcon, ImageIcon, EditIcon } from "miruIcons";
import { useParams } from "react-router-dom";
import { MobileMoreOptions, Toastr, Tooltip } from "StyledComponents";

import teamApi from "apis/team";
import teamsApi from "apis/teams";
import { useTeamDetails } from "context/TeamDetailsContext";
import { teamsMapper } from "mapper/teams.mapper";

export const UserInformation = () => {
  const [showImageUpdateOptions, setShowImageUpdateOptions] =
    useState<boolean>(false);
  const [userImageUrl, setUserImageUrl] = useState<any>(null);
  const {
    details: { personalDetails },
    updateDetails,
  } = useTeamDetails();
  const { memberId } = useParams();

  const getDetails = async () => {
    try {
      const res: any = await teamsApi.get(memberId);
      const addRes = await teamsApi.getAddress(memberId);
      const teamsObj = teamsMapper(res.data, addRes.data.addresses[0]);
      updateDetails("personal", teamsObj);
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
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      await teamApi.updateTeamMemberAvatar(memberId, payload, { headers });
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    setShowImageUpdateOptions(false);
    await teamApi.destroyTeamMemberAvatar(memberId);
    setUserImageUrl(null);
  };

  const getAvatar = async () => {
    const responseData = await teamsApi.get(memberId);
    setUserImageUrl(responseData.data.avatar_url);
  };

  useEffect(() => {
    getAvatar();
    getDetails();
  }, []);

  return (
    <div>
      <div className="flex h-88 w-full flex-row items-center bg-miru-han-purple-1000 p-4 text-white">
        <div className="relative flex h-14 w-1/5 justify-center">
          <img
            className="h-14 w-14 rounded-full"
            src={userImageUrl || UserAvatarSVG}
          />
          <button
            className="absolute right-0 bottom-0	flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-miru-white-1000"
            onClick={() => setShowImageUpdateOptions(true)}
          >
            <EditIcon color="#5B34EA" size={12} weight="bold" />
          </button>
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
                className="hidden"
                id="org-profile-image-input"
                name="myImage"
                type="file"
                onChange={handleProfileImageChange}
              />
            </li>
            {userImageUrl && (
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
            )}
          </MobileMoreOptions>
        ) : null}
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

import React, { useEffect, useState } from "react";

import { UserAvatarSVG, DeleteIcon, ImageIcon, EditIcon } from "miruIcons";
import { MoreOptions, Toastr, Tooltip } from "StyledComponents";

import teamApi from "apis/team";
import teamsApi from "apis/teams";
import { useProfileContext } from "context/Profile/ProfileContext";

const UserInformation = () => {
  const {
    personalDetails: { first_name, last_name, id },
  } = useProfileContext();

  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const getAvatar = async () => {
    try {
      const responseData = await teamsApi.get(id);
      setImageUrl(responseData.data.avatar_url);
    } catch {
      Toastr.error("Error in getting Profile Image");
    }
  };

  useEffect(() => {
    if (id) {
      getAvatar();
    }
  }, [id]);

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
      await teamApi.updateTeamMemberAvatar(id, payload, { headers });
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      setShowProfileOptions(false);
      await teamApi.destroyTeamMemberAvatar(id);
      setImageUrl(null);
    } catch {
      Toastr.error("Error in deleting Profile Image");
    }
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
        <div className="relative mt-3 flex flex-col items-center justify-center border-b-8 border-miru-gray-200 pb-8">
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

export default UserInformation;

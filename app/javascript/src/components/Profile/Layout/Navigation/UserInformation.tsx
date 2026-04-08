import React, { useEffect, useState } from "react";

import { teamApi, teamsApi } from "apis/api";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { getDisplayAvatarUrl } from "helpers";
import { UserAvatarSVG, DeleteIcon, ImageIcon, EditIcon } from "miruIcons";
import { MoreOptions, Toastr, Tooltip } from "StyledComponents";

const UserInformation = () => {
  const {
    personalDetails: { first_name, last_name, id, email_id },
    isCalledFromSettings,
  } = useProfileContext();
  const { avatarUrl, setCurrentAvatarUrl, user } = useUserContext();

  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  // Use current user data when in settings context
  const displayName =
    isCalledFromSettings && user
      ? `${user.first_name} ${user.last_name}`
      : `${first_name} ${last_name}`;

  const userId = isCalledFromSettings && user ? user.id : id;
  const displayImageUrl =
    getDisplayAvatarUrl(
      imageUrl,
      isCalledFromSettings ? user?.email || email_id : email_id,
      96
    ) || UserAvatarSVG;

  const getAvatar = async () => {
    if (!userId) return;

    try {
      if (isCalledFromSettings && user) {
        const nextImageUrl = avatarUrl || user.avatar_url || null;
        setImageUrl(nextImageUrl);
        setUploadedImageUrl(user.avatar_url || null);
      } else {
        const responseData = await teamsApi.get(userId);
        setImageUrl(responseData.data.avatar_url || null);
        setUploadedImageUrl(responseData.data.avatar_url || null);
      }
    } catch {
      Toastr.error("Error in getting Profile Image");
    }
  };

  useEffect(() => {
    if (userId) {
      getAvatar();
    }
  }, [avatarUrl, user, userId]);

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
      setUploadedImageUrl(URL.createObjectURL(file));
      const payload = createFormData(file);
      const response = await teamApi.updateTeamMemberAvatar(userId, payload);
      setImageUrl(response.data.avatar_url);
      setUploadedImageUrl(response.data.avatar_url);
      if (isCalledFromSettings) setCurrentAvatarUrl(response.data.avatar_url);
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      setShowProfileOptions(false);
      await teamApi.destroyTeamMemberAvatar(userId);
      setImageUrl(null);
      setUploadedImageUrl(null);
      if (isCalledFromSettings) setCurrentAvatarUrl(null);
    } catch {
      Toastr.error("Error in deleting Profile Image");
    }
  };

  return (
    <div>
      <div className="flex h-32 w-full items-center rounded-t-xl border border-border border-b-0 bg-muted p-4" />
      <div className="flex flex-col justify-center rounded-b-xl border border-border border-t-0 bg-card">
        <div className="relative flex h-12 justify-center -mt-12">
          <div className="relative">
            <img
              className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-xl"
              src={displayImageUrl}
            />
            <button
              className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-transform duration-200 hover:scale-110 hover:bg-accent"
              onClick={() => setShowProfileOptions(!showProfileOptions)}
            >
              <EditIcon color="currentColor" size={16} weight="bold" />
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex flex-col items-center justify-center pb-6">
          {showProfileOptions && (
            <MoreOptions setVisibilty={setShowProfileOptions}>
              <li className="absolute bottom--10 z-15 mx-auto mt-6 min-h-24 w-28 flex-col items-end rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-c1 group-hover:flex">
                <label
                  className="flex cursor-pointer flex-row items-center p-1.5 text-sm text-foreground"
                  htmlFor="file-input"
                >
                  <ImageIcon color="currentColor" size={16} weight="bold" />
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
                {uploadedImageUrl && (
                  <li
                    className="flex cursor-pointer flex-row items-center p-1.5 text-sm text-destructive"
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
              <span className="text-2xl font-bold text-foreground">
                {displayName}
              </span>
            </div>
          </Tooltip>
          <span className="text-xs leading-4 tracking-wider text-foreground" />
        </div>
      </div>
    </div>
  );
};

export default UserInformation;

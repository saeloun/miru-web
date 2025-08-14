import React, { useState } from "react";

import { useUserContext } from "context/UserContext";
import { useKeypress } from "helpers";
import { DeleteIcon, ImageIcon } from "miruIcons";
import { MobileMoreOptions } from "StyledComponents";

export const ProfileImage = ({ src, handleDeleteLogo, onLogoChange }) => {
  const { isDesktop } = useUserContext();
  const [showImageUpdateOptions, setShowImageUpdateOptions] =
    useState<boolean>(false);

  const handleEscapeKey = e => {
    e.stopPropagation();
    setShowImageUpdateOptions(false);
  };

  useKeypress("Escape", handleEscapeKey);

  return (
    <div
      className={`${
        isDesktop ? "profile-setting-image" : ""
      } dashed-border relative flex h-20 w-20 flex-col items-center justify-center rounded border-miru-dark-purple-100 bg-white p-0.5 text-center text-xs md:h-120 md:w-30`}
    >
      <img
        alt="org_logo"
        className="h-full min-w-full"
        src={src}
        onClick={() => setShowImageUpdateOptions(true)}
      />
      {isDesktop ? (
        <div className="hover-button absolute flex flex-col">
          <div className=" flex cursor-pointer flex-row items-center text-miru-han-purple-1000">
            <ImageIcon height="12px" size={16} weight="bold" width="12px" />
            <label
              className="ml-2 cursor-pointer text-xs font-bold"
              htmlFor="file-input"
            >
              Upload
            </label>
            <input
              className="hidden"
              id="file-input"
              name="myImage"
              type="file"
              onChange={onLogoChange}
            />
          </div>
          <div className="flex cursor-pointer flex-row items-center text-miru-red-400">
            <DeleteIcon height="12px" size={16} weight="bold" width="12px" />
            <button
              className="ml-2 text-xs font-bold "
              onClick={handleDeleteLogo}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          {showImageUpdateOptions ? (
            <MobileMoreOptions
              className="h-14/100 w-full md:mx-auto md:h-1/10 md:w-11/12"
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
                  onChange={e => {
                    e.stopPropagation();
                    onLogoChange(e);
                    setShowImageUpdateOptions(false);
                  }}
                />
              </li>
              <li
                className="flex w-full items-center gap-x-2 pb-5"
                onClick={handleDeleteLogo}
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
        </>
      )}
    </div>
  );
};

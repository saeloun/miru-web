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
      } dashed-border relative flex h-20 w-20 flex-col items-center justify-center rounded border border-border bg-card p-0.5 text-center text-xs md:h-120 md:w-30`}
    >
      <img
        alt="org_logo"
        className="h-full min-w-full"
        src={src}
        onClick={() => setShowImageUpdateOptions(true)}
      />
      {isDesktop ? (
        <div className="hover-button absolute flex flex-col">
          <div className=" flex cursor-pointer flex-row items-center text-primary">
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
          <div className="flex cursor-pointer flex-row items-center text-destructive">
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
                    <ImageIcon color="currentColor" size={16} />
                  </div>
                  <p className="font-sans text-sm font-medium text-primary">
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
                  <DeleteIcon color="currentColor" size={15} />
                </div>
                <p className="font-sans text-sm font-medium text-destructive">
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

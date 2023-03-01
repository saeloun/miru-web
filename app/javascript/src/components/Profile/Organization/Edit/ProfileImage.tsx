import React from "react";

import { DeleteIcon, ImageIcon } from "miruIcons";

export const ProfileImage = ({ src, handleDeleteLogo, onLogoChange }) => (
  <div className="profile-setting-image dashed-border relative flex h-120 w-30 flex-col items-center justify-center rounded border-miru-dark-purple-100 bg-white p-0.5 text-center text-xs">
    <img alt="org_logo" className="h-full min-w-full" src={src} />
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
        <button className="ml-2 text-xs font-bold " onClick={handleDeleteLogo}>
          Delete
        </button>
      </div>
    </div>
  </div>
);

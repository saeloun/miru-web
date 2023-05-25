import React from "react";

import { NavAvatarSVG } from "miruIcons";

const UserInfo = ({ user }) => (
  <div className="overflow-XIcon-auto flex h-16 w-full items-center bg-miru-gray-100 p-4">
    <img alt="avatar" className="mr-2" src={NavAvatarSVG} />
    <div className="overflow-XIcon-auto flex flex-col">
      <span className="pt-1 text-base font-bold leading-5">{`${user.first_name} ${user.last_name}`}</span>
      <span className="text-xs font-normal leading-4">{user.email}</span>
    </div>
  </div>
);

export default UserInfo;

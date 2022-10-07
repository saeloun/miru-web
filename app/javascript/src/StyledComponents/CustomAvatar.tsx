import React from "react";

const avatar = require("../../../assets/images/NavAvatar.svg"); //eslint-disable-line

const CustomAvatar = ({ url="", initials="" }) => (
  url ? <img
    className="inline-block md:h-10 md:w-10 h-5 w-5 rounded-full"
    src={url}
    alt="profile_pic"
  />
    : initials ? <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-500">
      <span className="text-xl font-medium leading-none text-white">{initials}</span>
    </span>
      : <img src={avatar} className="inline-block md:h-10 md:w-10 h-5 w-5 rounded-full" alt="avatar"/>
);

export default CustomAvatar;

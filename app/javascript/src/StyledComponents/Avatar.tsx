import React, { useState, useEffect } from "react";

import classnames from "classnames";

const avatar = require("../../../assets/images/NavAvatar.svg"); //eslint-disable-line

const Avatar = ({ url = "", name = "" }) => {
  const [initials, setInitials] = useState<string>(null);

  const getInitials = () => {
    if (name) {
      const parts = name.split(" ");
      let initials = "";
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0 && parts[i] !== "") {
          initials += parts[i][0];
        }
      }
      const finalInitials =
        initials.charAt(0) + initials.charAt(initials.length - 1);
      setInitials(finalInitials);
    }
  };

  useEffect(() => getInitials(), [initials]);

  return url ? (
    <img
      className={classnames(
        "inline-block md:h-10 md:w-10 h-5 w-5 rounded-full"
      )}
      src={url}
      alt="profile_pic"
    />
  ) : initials ? (
    <div className="inline-block">
      <span
        className={classnames(
          "inline-flex md:h-10 md:w-10 h-6 w-6 rounded-full items-center justify-center bg-gray-500"
        )}
      >
        <span
          className={classnames(
            "md:text-xl text-xs md:font-medium font-light leading-none text-white"
          )}
        >
          {initials}
        </span>
      </span>
    </div>
  ) : (
    <img
      src={avatar}
      className={classnames(
        "inline-block md:h-10 md:w-10 h-5 w-5 rounded-full"
      )}
      alt="avatar"
    />
  );
};

export default Avatar;

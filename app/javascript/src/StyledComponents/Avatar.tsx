import React, { useState, useEffect } from "react";

import classnames from "classnames";

const avatar = require("../../../assets/images/NavAvatar.svg"); //eslint-disable-line

type AvatarProps = {
  url?: string;
  name?: string;
  classNameImg?: string;
  classNameInitials?: string;
  classNameInitialsWrapper?: string;
};

const Avatar = ({
  url = "",
  name = "",
  classNameImg = "",
  classNameInitials = "",
  classNameInitialsWrapper = ""
}: AvatarProps) => {
  const [initials, setInitials] = useState<string>(null);
  const DEFAULT_STYLE_IMAGE = "inline-block md:h-10 md:w-10 h-5 w-5 rounded-full";
  const DEFAULT_STYLE_INITIALS = "md:text-xl text-xs md:font-medium font-light leading-none text-white";
  const DEFAULT_STYLE_INITIALS_WRAPPER = "inline-flex md:h-10 md:w-10 h-6 w-6 rounded-full items-center justify-center bg-gray-500";

  const getInitials = () => {
    if (name) {
      const parts = name.match(/\b(\w)/g);
      const initials = parts.join("").slice(0,2);
      setInitials(initials.toUpperCase());
    }
  };

  useEffect(() => getInitials(), []);

  if (url) {
    return (
      <img
        className={classnames(DEFAULT_STYLE_IMAGE, classNameImg)}
        src={url}
        alt="profile_pic"
      />
    );
  }
  if (initials) {
    return (
      <div className={classnames("inline-block")}>
        <span
          className={classnames(
            DEFAULT_STYLE_INITIALS_WRAPPER,
            classNameInitialsWrapper
          )}
        >
          <span
            className={classnames(DEFAULT_STYLE_INITIALS, classNameInitials)}
          >
            {initials}
          </span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={avatar}
      className={classnames(DEFAULT_STYLE_IMAGE, classNameImg)}
      alt="avatar"
    />
  );
};

export default Avatar;

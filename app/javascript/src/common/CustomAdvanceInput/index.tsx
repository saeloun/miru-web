/* eslint-disable import/exports-last */

import React, { useEffect, useState, useRef } from "react";

import classNames from "classnames";

import { useOutsideClick } from "../../helpers/outsideClick";

export const CustomAdvanceInput = ({
  id,
  value,
  label,
  wrapperClassName = "",
  inputBoxClassName = "",
}) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState<boolean>(false);
  const defaultInputBoxClassName = `form__input block w-full h-full appearance-none p-4 text-base bg-white ${
      focused ? "border-miru-han-purple-1000" : "border-miru-gray-1000"
    }`,
    defaultWrapperClassName = "outline relative";

  const labelClassName =
    focused || value
      ? "absolute duration-300 -top-2 -z-1 left-4 origin-0 text-xs font-normal text-miru-dark-purple-400 bg-white"
      : "absolute duration-300 -z-1 origin-0 top-3 left-4 text-miru-dark-purple-200 bg-white text-sm lg:text-base font-medium";

  useEffect(() => {
    focused
      ? document.getElementById(id).focus()
      : document.getElementById(id).blur();
  }, [focused]);

  useOutsideClick(inputRef, () => setFocused(false));

  return (
    <div
      className={classNames(defaultWrapperClassName, wrapperClassName)}
      ref={inputRef}
      onClick={() => setFocused(true)}
    >
      <div
        className={classNames(defaultInputBoxClassName, inputBoxClassName)}
        id={id}
      >
        {value}
      </div>
      <span className={labelClassName}>{label}</span>
    </div>
  );
};

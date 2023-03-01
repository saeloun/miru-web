/* eslint-disable import/exports-last */

import React, { useEffect, useState, useRef } from "react";

import { useOutsideClick } from "../helpers/outsideClick";

export const CustomTextareaAutosize = ({
  id,
  inputBoxClassName,
  name,
  value,
  onChange,
  label,
  wrapperClassName,
  rows,
}) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState<boolean>(false);
  const labelClassName =
    focused || value
      ? "absolute duration-300 -top-2 -z-1 left-4 origin-0 bg-white text-xs font-normal text-miru-dark-purple-400"
      : "absolute duration-300 -z-1 origin-0 top-3 left-4 text-miru-dark-purple-200 bg-white text-base font-medium";

  useEffect(() => {
    focused
      ? document.getElementById(id).focus()
      : document.getElementById(id).blur();
  }, [focused]);

  useOutsideClick(inputRef, () => setFocused(false));

  return (
    <div
      className={wrapperClassName}
      ref={inputRef}
      onClick={() => setFocused(true)}
    >
      <textarea
        className={inputBoxClassName}
        id={id}
        name={name}
        placeholder=" "
        rows={rows}
        value={value}
        onChange={onChange}
      />
      <span className={labelClassName}>{label}</span>
    </div>
  );
};

CustomTextareaAutosize.defaultProps = {
  inputBoxClassName:
    "form__input block w-full appearance-none bg-white p-4 text-base h-16 border-miru-gray-1000",
  wrapperClassName: "outline relative",
};

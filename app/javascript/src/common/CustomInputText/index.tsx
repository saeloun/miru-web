/* eslint-disable import/exports-last */

import React from "react";

export const CustomInputText = ({
  id,
  inputBoxClassName,
  dataCy,
  disabled,
  name,
  type,
  value,
  onChange,
  labelClassName,
  label,
  wrapperClassName,
}) => (
  <div className={wrapperClassName}>
    <input
      className={inputBoxClassName}
      data-cy={dataCy}
      disabled={disabled}
      id={id}
      name={name}
      placeholder=" "
      type={type}
      value={value}
      onChange={onChange}
    />
    <label className={labelClassName} htmlFor={name}>
      {label}
    </label>
  </div>
);

CustomInputText.defaultProps = {
  inputBoxClassName:
    "form__input block w-full appearance-none bg-white p-4 text-base h-12 border-miru-gray-1000",
  type: "text",
  labelClassName:
    "absolute duration-300 top-3 -z-1 origin-0 text-gray-500 bg-white px-3 text-base font-medium text-miru-dark-purple-200",
  wrapperClassName: "outline relative h-12",
  disabled: false,
};

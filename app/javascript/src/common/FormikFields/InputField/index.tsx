/* eslint-disable import/exports-last */

import React, { useState } from "react";

import { Field } from "formik";
import { PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";

const InputField = ({
  label,
  id,
  name,
  type,
  autoFocus,
  disabled,
  inputBoxClassName,
  labelClassName,
  wrapperClassName,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="field relative">
      <div className={wrapperClassName}>
        <Field
          autoFocus={autoFocus}
          className={inputBoxClassName}
          disabled={disabled}
          id={id}
          name={name}
          placeholder=" "
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
        />
        <label className={labelClassName} htmlFor={name}>
          {label}
        </label>
        {type == "password" && (
          <span
            className="absolute right-2 top-1/3 z-10 cursor-pointer"
            onClick={handleTogglePasswordVisibility}
          >
            {!showPassword ? (
              <img
                alt="pass_icon"
                height="12"
                src={PasswordIconSVG}
                width="12"
              />
            ) : (
              <img
                alt="pass_icon_text"
                height="12"
                src={PasswordIconTextSVG}
                width="12"
              />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

InputField.defaultProps = {
  type: "text",
  inputBoxClassName:
    "form__input block w-full appearance-none bg-white p-4 text-base h-12 border-miru-gray-1000",
  labelClassName:
    "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium text-miru-dark-purple-200 duration-300",
  wrapperClassName: "outline relative h-12",
  disabled: false,
  autoFocus: false,
};

export default InputField;

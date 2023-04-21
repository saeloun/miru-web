/* eslint-disable import/exports-last */

import React, { useState } from "react";

import classNames from "classnames";
import { Field } from "formik";
import { PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";

const defaultInputBoxClassName =
  "form__input block w-full appearance-none bg-white p-3.75 text-sm lg:text-base h-12 border-miru-gray-1000";

const defaultLabelClassname =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm lg:text-base font-medium text-miru-dark-purple-200 duration-300";
const defaultWrapperClassName = "outline relative h-12";

const InputField = ({
  readOnly,
  label,
  id,
  name,
  type,
  autoFocus,
  disabled,
  inputBoxClassName,
  labelClassName,
  wrapperClassName,
  autoComplete,
  onChange,
  onClick,
  hasError,
  resetErrorOnChange,
  setFieldError,
  setFieldValue,
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const clearErrorOnChange = (name, setFieldError) => {
    if (setFieldError && name) {
      setFieldError(name, "");
    }
  };

  const handleChange = e => {
    if (resetErrorOnChange) {
      if (hasError) {
        clearErrorOnChange(name, setFieldError);
      }

      if (setFieldValue && name) {
        setFieldValue(name, e.target.value);
      }
    }

    if (onChange) {
      onChange(e);
    }
  };

  const optionalFieldProps =
    resetErrorOnChange || onChange ? { onChange: e => handleChange(e) } : {};

  return (
    <div
      className={classNames(
        defaultWrapperClassName,
        "field relative mb-6 xsm:mb-2",
        wrapperClassName
      )}
    >
      <Field
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        id={id}
        name={name}
        placeholder=" "
        readOnly={readOnly}
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        className={classNames(defaultInputBoxClassName, inputBoxClassName, {
          "error-input border-miru-red-400": hasError,
        })}
        onChange={onChange}
        onClick={onClick}
        {...optionalFieldProps}
      />
      <label
        className={classNames(defaultLabelClassname, labelClassName)}
        htmlFor={name}
      >
        {label}
      </label>
      {type == "password" && (
        <span
          className="menuButton absolute right-2 top-1/4 z-30 cursor-pointer bg-white p-1.5"
          onClick={handleTogglePasswordVisibility}
        >
          {!showPassword ? (
            <img alt="pass_icon" height="12" src={PasswordIconSVG} width="12" />
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
  );
};

InputField.defaultProps = {
  type: "text",
  inputBoxClassName: "",
  labelClassName: "",
  wrapperClassName: "",
  disabled: false,
  autoFocus: false,
  autoComplete: "on",
  readOnly: false,
  onChange: undefined,
  onClick: undefined,
  hasError: false,
  resetErrorOnChange: true,
  setFieldError: null,
  setFieldValue: null,
};

export default InputField;

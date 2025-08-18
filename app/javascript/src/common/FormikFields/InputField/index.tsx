import React, { useEffect, useState } from "react";

import classNames from "classnames";
import { Field } from "formik";
import { PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";

const defaultInputBoxClassName =
  "form__input block w-full appearance-none bg-white p-3.75 text-base lg:text-base h-12 border border-miru-gray-200 rounded focus:border-miru-han-purple-400 focus:ring-1 focus:ring-miru-han-purple-400 transition-colors";

const defaultLabelClassname =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm lg:text-base font-medium text-miru-dark-purple-400 duration-300";
const defaultWrapperClassName = "outline relative h-12";

const InputField = ({
  readOnly = false,
  label,
  id,
  name,
  type = "text",
  autoFocus = false,
  disabled = false,
  inputBoxClassName = "",
  labelClassName = "",
  wrapperClassName = "",
  autoComplete = "on",
  onChange = undefined,
  onClick = undefined,
  hasError = false,
  resetErrorOnChange = true,
  setFieldError = null,
  setFieldValue = null,
  marginBottom = "mb-2 xsm:mb-6",
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [defaultMarginBottom, setDefaultMarginBottom] =
    useState<string>(marginBottom);

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

  useEffect(() => {
    if (hasError) {
      setDefaultMarginBottom("mb-2");
    } else {
      setDefaultMarginBottom(marginBottom);
    }
  }, [hasError]);

  const optionalFieldProps =
    resetErrorOnChange || onChange ? { onChange: e => handleChange(e) } : {};

  return (
    <div
      className={classNames(
        defaultWrapperClassName,
        "field relative",
        wrapperClassName,
        defaultMarginBottom
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

export default InputField;

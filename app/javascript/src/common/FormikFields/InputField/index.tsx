import React, { useEffect, useState } from "react";

import { Field } from "formik";
import { PasswordIconSVG, PasswordIconTextSVG } from "miruIcons";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { cn } from "../../../lib/utils";

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
    <div className={cn("relative", wrapperClassName, defaultMarginBottom)}>
      {label && (
        <Label
          htmlFor={name}
          className={cn(
            "mb-2 block text-sm font-medium text-miru-dark-purple-400",
            labelClassName
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <Field
          as={Input}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          id={id || name}
          name={name}
          placeholder={label ? "" : " "}
          readOnly={readOnly}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          className={cn(
            hasError && "border-red-500 focus-visible:ring-red-500",
            inputBoxClassName
          )}
          onChange={onChange}
          onClick={onClick}
          {...optionalFieldProps}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
            onClick={handleTogglePasswordVisibility}
          >
            {!showPassword ? (
              <img
                alt="Show password"
                height="16"
                src={PasswordIconSVG}
                width="16"
              />
            ) : (
              <img
                alt="Hide password"
                height="16"
                src={PasswordIconTextSVG}
                width="16"
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;


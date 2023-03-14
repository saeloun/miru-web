/* eslint-disable import/exports-last */

import React from "react";

import classNames from "classnames";

export const CustomInputText = ({
  id,
  inputBoxClassName = "",
  dataCy,
  disabled,
  name,
  type,
  value,
  onChange,
  labelClassName = "",
  label,
  wrapperClassName = "",
  readOnly,
}) => {
  const defaultInputBoxClassName =
    "form__input block w-full appearance-none bg-white p-4 text-base h-12 border-miru-gray-1000";
  const defaultWrapperClassName = "outline relative h-12";
  const defaultLabelClassname =
    "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm lg:text-base font-medium text-miru-dark-purple-200 duration-300";

  return (
    <div className="field relative">
      <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
        <input
          className={classNames(defaultInputBoxClassName, inputBoxClassName)}
          data-cy={dataCy}
          disabled={disabled}
          id={id}
          name={name}
          placeholder=" "
          readOnly={readOnly}
          type={type}
          value={value}
          onChange={onChange}
        />
        <label
          className={classNames(defaultLabelClassname, labelClassName)}
          htmlFor={name}
        >
          {label}
        </label>
      </div>
    </div>
  );
};

CustomInputText.defaultProps = {
  type: "text",
  disabled: false,
  readOnly: false,
};

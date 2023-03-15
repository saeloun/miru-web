/* eslint-disable import/exports-last */

import React from "react";

import classNames from "classnames";

const defaultInputBoxClassName =
  "form__input block w-full appearance-none bg-white p-4 text-base h-12 border-miru-gray-1000";
const defaultWrapperClassName = "outline relative h-12";
const defaultLabelClassname =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-sm lg:text-base font-medium text-miru-dark-purple-200 duration-300";

type customInputTextProps = {
  id?: string;
  inputBoxClassName?: string;
  dataCy?: string;
  disabled?: boolean;
  name?: string;
  type?: string;
  value: any;
  onChange: any;
  labelClassName?: string;
  label?: string;
  wrapperClassName?: string;
  readOnly?: boolean;
  onFocus?: (e?: any) => void;
  onBlur?: (e?: any) => void;
};

export const CustomInputText = ({
  id,
  inputBoxClassName,
  dataCy,
  disabled,
  name,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  labelClassName,
  label,
  wrapperClassName,
  readOnly,
}: customInputTextProps) => (
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
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
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

CustomInputText.defaultProps = {
  dataCy: "",
  type: "text",
  disabled: false,
  readOnly: false,
  onChange: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  onFocus: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  onBlur: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
};

import React from "react";

import classNames from "classnames";

const defaultInputBoxClassName =
  "form__input block h-12 w-full appearance-none border-input bg-background p-4 text-sm text-foreground shadow-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 lg:text-base";
const defaultWrapperClassName = "outline relative h-12";
const defaultLabelClassname =
  "absolute top-0.5 z-1 h-6 origin-0 bg-background p-2 text-sm font-medium text-muted-foreground duration-300 2xl:text-base";

type customInputTextProps = {
  id?: string;
  inputBoxClassName?: string;
  disabled?: boolean;
  name?: string;
  type?: string;
  value: any;
  onChange?: any;
  labelClassName?: string;
  label?: string;
  wrapperClassName?: string;
  moveLabelToRightClassName?: string;
  moveLabelToLeftClassName?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  step?: any;
  min?: any;
  onFocus?: (_e?: any) => void;
  onBlur?: (_e?: any) => void;
  onClick?: (_e?: any) => void;
};

export const CustomInputText = ({
  id,
  inputBoxClassName,
  disabled = false,
  name,
  type = "text",
  value,
  onChange = () => {
    /* Default empty handler */
  },
  onFocus = () => {
    /* Default empty handler */
  },
  onBlur = () => {
    /* Default empty handler */
  },
  labelClassName,
  label,
  wrapperClassName,
  moveLabelToRightClassName = "",
  moveLabelToLeftClassName = "left-1",
  readOnly = false,
  step = 1,
  min = null,
  onClick = () => {
    /* Default empty handler */
  },
  autoFocus = false,
}: customInputTextProps) => (
  <div className={classNames(defaultWrapperClassName, wrapperClassName)}>
    <input
      autoFocus={autoFocus}
      className={classNames(defaultInputBoxClassName, inputBoxClassName)}
      disabled={disabled}
      id={id}
      min={min}
      name={name}
      placeholder=" "
      readOnly={readOnly}
      step={step}
      type={type}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
      onClick={onClick}
      onFocus={onFocus}
    />
    <label
      htmlFor={name}
      className={classNames([
        defaultLabelClassname,
        labelClassName,
        moveLabelToRightClassName?.trim()
          ? moveLabelToRightClassName
          : moveLabelToLeftClassName,
      ])}
    >
      {label}
    </label>
  </div>
);

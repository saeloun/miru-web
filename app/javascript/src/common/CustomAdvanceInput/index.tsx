import React, { useEffect, useState, useRef } from "react";

import classNames from "classnames";

import { useOutsideClick } from "../../helpers/outsideClick";

type CustomAdvanceInputProps = {
  id?: string;
  value: any;
  label?: string;
  wrapperClassName?: string;
  inputBoxClassName?: string;
  labelClassName?: string;
  onClick?: React.MouseEventHandler<any>;
  onBlur?: React.FocusEventHandler<any>;
};

const getDefaultInputBoxClassName = focused =>
  `form__input block w-full h-full appearance-none p-4 text-base bg-white ${
    focused ? "border-miru-han-purple-1000" : "border-miru-gray-1000"
  }`;

const getDefaultLabelClassName = (focused, value) =>
  focused || value
    ? "absolute duration-300 -top-2 -z-1 left-4 origin-0 text-xs font-normal text-miru-dark-purple-400 bg-white"
    : "absolute duration-300 -z-1 origin-0 top-3 left-4 text-miru-dark-purple-200 bg-white text-sm lg:text-base font-medium";

export const CustomAdvanceInput = ({
  id,
  value,
  label,
  wrapperClassName,
  inputBoxClassName,
  labelClassName,
  onClick,
  onBlur,
}: CustomAdvanceInputProps) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState<boolean>(false);
  const defaultInputBoxClassName = getDefaultInputBoxClassName(focused);
  const defaultLabelClassName = getDefaultLabelClassName(focused, value);

  useEffect(() => {
    if (id) {
      const element = document.getElementById(id);
      if (focused && element) {
        element.focus();
      } else if (element) {
        element.blur();
      }
    }
  }, [focused, id]);

  useOutsideClick(inputRef, () => setFocused(false));

  return (
    <div
      className={classNames("outline relative", wrapperClassName)}
      ref={inputRef}
      onClick={() => setFocused(true)}
    >
      <div
        className={classNames(defaultInputBoxClassName, inputBoxClassName)}
        id={id}
        onBlur={onBlur}
        onClick={onClick}
      >
        {value}
      </div>
      <span className={classNames(defaultLabelClassName, labelClassName)}>
        {label}
      </span>
    </div>
  );
};

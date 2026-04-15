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
  `form__input block h-full w-full appearance-none bg-background p-4 text-base text-foreground ${
    focused ? "border-primary" : "border-border"
  }`;

const getDefaultLabelClassName = (focused, value) =>
  focused || value
    ? "absolute -top-2 -z-1 left-4 origin-0 bg-background text-xs font-normal text-muted-foreground duration-300"
    : "absolute top-3 -z-1 left-4 origin-0 bg-background text-sm font-medium text-muted-foreground duration-300 lg:text-base";

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

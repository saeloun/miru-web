import React, { useState, useEffect, useRef } from "react";

import { isValid } from "./validate";

const TimeInput = ({
  autoFocus=false,
  initTime,
  disabled,
  mountFocus,
  onTimeChange,
  type,
  onFocusHandler,
  placeholder,
  className,
  name,
  onBlurHandler
}: Iprops) => {
  const [time, setTime] = useState<string>("");

  const _input = useRef(null);

  useEffect(() => {
    setTime(initTime);
  }, [initTime]);

  useEffect(() => {
    if (!disabled && mountFocus) {
      setTimeout(() => {
        autoFocus && _input.current.focus();
      }, 0);
    }
  }, [disabled, mountFocus]);

  let lastVal = "";

  const onChangeHandler = (val) => {
    if (val == time) {
      return;
    }
    if (isValid(val)) {
      if (val.length === 2 && lastVal.length === 3) {
        val = val.slice(0, 1);
      }

      if (val.length > 10) {
        return false;
      }

      lastVal = val;

      setTime(val);

      onTimeChange(val);
    }
  };

  const getType = () => {
    if (type) {
      return type;
    }
    return "tel";
  };

  return (
    <input
      name={name ? name : undefined}
      className={className}
      type={getType()}
      disabled={disabled}
      placeholder={placeholder}
      value={time}
      onChange={(e) => onChangeHandler(e.target.value)}
      onFocus={(onFocusHandler) ? (e) => onFocusHandler(e) : undefined}
      onBlur={(onBlurHandler) ? (e) => onBlurHandler(e) : undefined}
      ref={_input}
    />
  );

};

TimeInput.defaultProps = {
  placeholder: "HH:MM"
};

interface Iprops {
	autoFocus?: boolean;
	initTime?: string;
	disabled?: boolean;
	mountFocus?: string;
	classNameInitials?: string;
	classNameInitialsWrapper?: string;
	onTimeChange?: (val) => any,
	type?: string,
	onFocusHandler?: (e) => any,
	placeholder?: string,
	className?: string ,
	name?: string,
	onBlurHandler?: (e) => any
  }

export default TimeInput;

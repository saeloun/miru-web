import React, { useState, useEffect, useRef } from "react";

import { isValid } from "./validate";

const TimeInput = ({
  autoFocus = false,
  initTime = "",
  disabled,
  mountFocus,
  onTimeChange,
  type,
  onFocusHandler,
  placeholder = "HH:MM",
  className,
  name,
  onBlurHandler,
  key,
  id,
}: Iprops) => {
  const [time, setTime] = useState<string>("");

  const _input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTime(initTime);
  }, [initTime]);

  useEffect(() => {
    if (!disabled && mountFocus && autoFocus && _input.current) {
      setTimeout(() => {
        _input.current?.focus();
      }, 0);
    }
  }, [disabled, mountFocus, autoFocus]);

  let lastVal = "";

  const onChangeHandler = (val: string) => {
    if (val === time) {
      return;
    }

    if (isValid(val)) {
      if (val.length === 2 && lastVal.length === 3) {
        val = val.slice(0, 1);
      }

      if (val.length > 10) {
        return;
      }

      lastVal = val;

      setTime(val);

      onTimeChange?.(val);
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
      className={className}
      disabled={disabled}
      id={id}
      key={key}
      name={name || undefined}
      placeholder={placeholder}
      ref={_input}
      type={getType()}
      value={time}
      onBlur={onBlurHandler ? e => onBlurHandler(e) : undefined}
      onChange={e => onChangeHandler(e.target.value)}
      onFocus={onFocusHandler ? e => onFocusHandler(e) : undefined}
    />
  );
};

interface Iprops {
  key?: number | string;
  id?: string;
  autoFocus?: boolean;
  initTime?: string;
  disabled?: boolean;
  mountFocus?: string;
  onTimeChange?: (_val: string) => void;
  type?: string;
  onFocusHandler?: (_e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  onBlurHandler?: (_e: React.FocusEvent<HTMLInputElement>) => void;
}

export default TimeInput;

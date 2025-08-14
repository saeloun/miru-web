import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

const isValid = (val: string): boolean => {
  const regexp = /^\d{0,2}?:?\d{0,2}$/;
  const valid = regexp.test(val);
  if (!valid) return false;

  const hours = Number(val.split(":")[0]);
  const minutes = val.split(":")[1];

  if (hours && hours > 23) return false;

  if (minutes && Number(minutes) > 59) return false;

  return true;
};

interface TimeInputProps {
  key?: number | string;
  id?: string;
  autoFocus?: boolean;
  initTime?: string;
  disabled?: boolean;
  mountFocus?: string;
  onTimeChange?: (val: string) => void;
  type?: string;
  onFocusHandler?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  onBlurHandler?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
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
    },
    ref
  ) => {
    const [time, setTime] = useState<string>("");
    const _input = useRef<HTMLInputElement>(null);
    const inputRef =
      (ref as React.MutableRefObject<HTMLInputElement>) || _input;

    useEffect(() => {
      setTime(initTime);
    }, [initTime]);

    useEffect(() => {
      if (!disabled && mountFocus && autoFocus && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
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

        if (val.length === 2 && lastVal.length !== 3) {
          val = `${val}:`;
        }

        if (val.length > 5) {
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
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        id={id}
        key={key}
        name={name || undefined}
        placeholder={placeholder}
        ref={inputRef}
        type={getType()}
        value={time}
        onBlur={onBlurHandler ? e => onBlurHandler(e) : undefined}
        onChange={e => onChangeHandler(e.target.value)}
        onFocus={onFocusHandler ? e => onFocusHandler(e) : undefined}
      />
    );
  }
);

TimeInput.displayName = "TimeInput";

export default TimeInput;

import React, { useEffect, useState, useRef } from "react";

import TextareaAutosize from "react-textarea-autosize";

import { useOutsideClick } from "../helpers/outsideClick";

export const CustomTextareaAutosize = ({
  id,
  inputBoxClassName = "form__input block h-16 w-full appearance-none border-border bg-background p-4 text-sm text-foreground lg:text-base",
  name,
  value,
  onChange,
  label,
  wrapperClassName = "outline relative",
  rows,
  maxRows,
  maxLength = 100000000,
}) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState<boolean>(false);
  const labelClassName =
    focused || value
      ? "absolute -top-2 -z-1 left-4 origin-0 bg-background text-xs font-normal text-muted-foreground duration-300"
      : "absolute -z-1 left-4 top-3 origin-0 bg-background text-sm font-medium text-muted-foreground duration-300 lg:text-base";

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
      className={wrapperClassName}
      ref={inputRef}
      onClick={() => setFocused(true)}
    >
      <TextareaAutosize
        className={inputBoxClassName}
        cols={60}
        id={id}
        maxLength={maxLength}
        maxRows={maxRows}
        name={name}
        placeholder=" "
        rows={rows}
        value={value}
        onChange={onChange}
      />
      <span className={labelClassName}>{label}</span>
    </div>
  );
};

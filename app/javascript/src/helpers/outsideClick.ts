import React, { useEffect } from "react";

export const useOutsideClick = (
  ref: React.RefObject<HTMLInputElement>,
  callback,
  condition = true
) => {
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        ref &&
        ref.current &&
        !ref.current.contains(event.target) &&
        condition
      ) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, condition, callback]);
};

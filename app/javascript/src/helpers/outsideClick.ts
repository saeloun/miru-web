import React, { useEffect } from "react";

const useOutsideClick = (ref:React.RefObject<HTMLInputElement>, callback, condition=true) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target) && condition) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, condition]);
};

export default useOutsideClick;

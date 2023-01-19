import React, { useRef } from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";

const DEFAULT_STYLE =
  "absolute right-20 rounded-lg border-2 border-miru-gray-200 bg-white py-2 drop-shadow";
type MoreOptionsProps = {
  children?: any;
  className?: string;
  setVisibilty;
};

const MoreOptions = ({
  children,
  className,
  setVisibilty,
}: MoreOptionsProps) => {
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, () => setVisibilty(false));

  return (
    <ul className={classnames(DEFAULT_STYLE, className)} ref={wrapperRef}>
      {children}
    </ul>
  );
};

export default MoreOptions;

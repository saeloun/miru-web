import React, { useRef } from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";

const DEFAULT_STYLE =
  "absolute rounded-lg border-miru-gray-200 bg-white py-2 shadow-c1 text-sm w-34";
type MoreOptionsProps = {
  children?: any;
  className?: string;
  setVisibilty: (visible: boolean) => void;
};

const MoreOptions = ({
  children,
  className,
  setVisibilty,
}: MoreOptionsProps) => {
  const wrapperRef = useRef<HTMLUListElement>(null);
  useOutsideClick(wrapperRef, () => setVisibilty(false));

  return (
    <ul className={classnames(DEFAULT_STYLE, className)} ref={wrapperRef}>
      {children}
    </ul>
  );
};

export default MoreOptions;

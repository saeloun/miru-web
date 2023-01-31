import React from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";

const DEFAULT_STYLE =
  "absolute rounded-lg border-miru-gray-200 bg-white py-2 shadow-c1 text-sm w-34";
type MoreOptionsProps = {
  children?: any;
  className?: string;
  setVisibilty;
  wrapperRef: any;
};

const MoreOptions = ({
  children,
  className,
  setVisibilty,
  wrapperRef,
}: MoreOptionsProps) => {
  useOutsideClick(wrapperRef, () => setVisibilty(false));

  return <ul className={classnames(DEFAULT_STYLE, className)}>{children}</ul>;
};

export default MoreOptions;

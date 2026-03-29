import React from "react";

import classNames from "classnames";

export const Divider = ({ CustomStyle = "" }) => (
  <div
    className={classNames(
      "w-full max-w-full border-[1px] border-t border-solid border-border",
      CustomStyle
    )}
  />
);

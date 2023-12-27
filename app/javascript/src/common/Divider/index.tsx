import React from "react";

import classNames from "classnames";

export const Divider = ({ CustomStyle = "" }) => (
  <div
    className={classNames(
      "w-[648px] border-[1px] border-t border-solid border-miru-gray-400",
      CustomStyle
    )}
  />
);

import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 tracking-wider text-purple-800 bg-purple-100";

type BadgeProps = {
  text: string | number,
  color: string,
  bgColor: string,
  className?: string
}

const Badge = ({
  text = null,
  color = "",
  bgColor = "",
  className = ""
}: BadgeProps) => (
  <span className={classnames(DEFAULT_STYLE, color, bgColor, className)}>
    {text || "Badge"}
  </span>
);

export default Badge;

import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 tracking-wider";

type BadgeProps = {
  text?: string | number;
  color?: string;
  bgColor?: string;
  className?: string;
};

const Badge = ({
  text = "Badge",
  color = "text-purple-800",
  bgColor = "bg-purple-100",
  className,
}: BadgeProps) => (
  <span className={classnames(DEFAULT_STYLE, color, bgColor, className)}>
    {text}
  </span>
);

export default Badge;

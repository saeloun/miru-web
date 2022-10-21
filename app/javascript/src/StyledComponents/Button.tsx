import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE = "rounded text-center border";

const PRIMARY =
  "bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 text-white border-miru-han-purple-1000 hover:border-miru-han-purple-600";
const PRIMARY_DISABLED = "bg-miru-gray-1000 text-white ";

const SECONDARY =
  "bg-transparent hover:bg-miru-gray-1000 text-miru-han-purple-1000 border-miru-han-purple-1000";
const SECONDARY_DISABLED =
  "bg-transparent text-miru-dark-purple-200 border-miru-dark-purple-200";

const TERNARY =
  "bg-transparent text-miru-han-purple-1000 hover:text-miru-han-purple-600 border-0";
const TERNARY_DISABLED = "bg-transparent text-miru-dark-purple-200 border-0";

const SMALL = "px-9 py-1 text-xs font-bold leading-4";
const MEDIUM = "px-12 py-2.5 text-base font-bold leading-5";
const LARGE = "px-14 py-3.5 text-xl font-bold leading-7";

type ButtonProps = {
  style?: string;
  onClick;
  disabled?: boolean;
  size?: string;
  className?: string;
  fullWidth?: boolean;
  children?: any;
};

const BUTTON_STYLES = {
  primary: "primary",
  secondary: "secondary",
  ternary: "ternary"
};
const SIZES = { small: "small", medium: "medium", large: "large" };

const Button = ({
  style,
  size = SIZES.large,
  disabled = false,
  className = "",
  fullWidth = false,
  onClick,
  children
}: ButtonProps) => (
  <button
    className={classnames(
      DEFAULT_STYLE,
      fullWidth && "w-full",
      style == BUTTON_STYLES.primary && !disabled && PRIMARY,
      style == BUTTON_STYLES.primary && disabled && PRIMARY_DISABLED,

      style == BUTTON_STYLES.secondary && !disabled && SECONDARY,
      style == BUTTON_STYLES.secondary && disabled && SECONDARY_DISABLED,

      style == BUTTON_STYLES.ternary && !disabled && TERNARY,
      style == BUTTON_STYLES.ternary && disabled && TERNARY_DISABLED,

      size == SIZES.small && SMALL,
      size == SIZES.medium && MEDIUM,
      size == SIZES.large && LARGE,
      className
    )}
    onClick={onClick}
  >
    {children}
  </button>
);

export default Button;

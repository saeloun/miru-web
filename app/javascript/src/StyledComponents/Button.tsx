import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE = "rounded text-center p-2";

const PRIMARY =
  "bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 text-white  border border-miru-han-purple-1000 hover:border-miru-han-purple-600";

const PRIMARY_DISABLED =
  "bg-miru-gray-1000 text-white border border-miru-gray-1000";

const SECONDARY =
  "bg-transparent hover:bg-miru-gray-1000 text-miru-han-purple-1000 border border-miru-han-purple-1000";

const Calendar_Cell = "rounded-xl border-2 border-transparent text-left";

const SECONDARY_DISABLED =
  "bg-transparent text-miru-dark-purple-200 border border-miru-dark-purple-200";

const TERNARY =
  "rounded bg-transparent text-miru-han-purple-1000 hover:bg-miru-dark-purple-100 hover:text-miru-han-purple-600 border-0";
const TERNARY_DISABLED = "bg-transparent text-miru-dark-purple-200 border-0";

const DASHED =
  "bg-white rounded border border-dashed border-miru-dark-purple-200 text-center text-base font-bold tracking-widest text-miru-dark-purple-200";

const DELETE = "bg-miru-red-400 hover:bg-miru-red-200 text-white";

const SMALL = "p-2 text-xs font-bold leading-4";
const MEDIUM = "p-2 text-base font-bold leading-5";
const LARGE = "p-2 text-xl font-bold leading-7";

type ButtonProps = {
  id?: string;
  style?: string;
  onClick?;
  disabled?: boolean;
  size?: string;
  className?: string;
  fullWidth?: boolean;
  children?: any;
  type?: any;
};

export const BUTTON_STYLES = {
  primary: "primary",
  secondary: "secondary",
  ternary: "ternary",
  dashed: "dashed",
  delete: "delete",
  calendarCell: "calendarCell",
};
const SIZES = { small: "small", medium: "medium", large: "large" };

const Button = ({
  id = "",
  style = "primary",
  size,
  disabled = false,
  className = "",
  fullWidth = false,
  onClick,
  children,
  type,
}: ButtonProps) => (
  <button
    id={id}
    disabled={disabled}
    type={type}
    className={classnames(
      DEFAULT_STYLE,
      fullWidth && "w-full",
      style == BUTTON_STYLES.primary && !disabled && PRIMARY,
      style == BUTTON_STYLES.primary && disabled && PRIMARY_DISABLED,

      style == BUTTON_STYLES.secondary && !disabled && SECONDARY,
      style == BUTTON_STYLES.secondary && disabled && SECONDARY_DISABLED,

      style == BUTTON_STYLES.ternary && !disabled && TERNARY,
      style == BUTTON_STYLES.ternary && disabled && TERNARY_DISABLED,

      style == BUTTON_STYLES.dashed && !disabled && DASHED,

      style == BUTTON_STYLES.delete && !disabled && DELETE,

      style == BUTTON_STYLES.calendarCell && Calendar_Cell,

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

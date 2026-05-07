import React from "react";

import classnames from "classnames";

const DEFAULT_STYLE = "rounded text-center p-2";

const PRIMARY =
  "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary hover:border-primary";

const PRIMARY_DISABLED =
  "bg-secondary text-secondary-foreground border border-border";

const SECONDARY =
  "bg-transparent hover:bg-secondary text-primary border border-primary";

const Calendar_Cell = "rounded-xl border-2 border-transparent text-left";

const SECONDARY_DISABLED =
  "bg-transparent text-muted-foreground border border-border";

const TERNARY =
  "rounded bg-transparent text-primary hover:bg-muted hover:text-primary border-0";
const TERNARY_DISABLED = "bg-transparent text-muted-foreground border-0";

const DASHED =
  "bg-white rounded border border-dashed border-border text-center text-base font-bold tracking-wider text-muted-foreground";

const DELETE = "bg-destructive hover:bg-destructive/90 text-white";

const SMALL = "p-2 text-xs font-bold leading-4";
const MEDIUM = "p-2 text-base font-bold leading-5";
const LARGE = "p-2 text-xl font-bold leading-7";

type ButtonProps = {
  id?: string;
  style?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  size?: string;
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
};

const SIZES = { small: "small", medium: "medium", large: "large" };

const Button = ({
  id,
  style = "primary",
  size,
  disabled = false,
  className = "",
  fullWidth = false,
  onClick,
  children,
  type = "button",
}: ButtonProps) => (
  <button
    disabled={disabled}
    id={id || undefined}
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

export const BUTTON_STYLES = {
  primary: "primary",
  secondary: "secondary",
  ternary: "ternary",
  dashed: "dashed",
  delete: "delete",
  calendarCell: "calendarCell",
};

export default Button;

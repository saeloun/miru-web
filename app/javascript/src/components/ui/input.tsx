import * as React from "react";
import { cn } from "../../lib/utils";
import { FORM_CONTROL_SURFACE_CLASS } from "./form-control-classes";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
        FORM_CONTROL_SURFACE_CLASS,
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };

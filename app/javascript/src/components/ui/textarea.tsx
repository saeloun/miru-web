import * as React from "react";
import { cn } from "../../lib/utils";
import { FORM_CONTROL_SURFACE_CLASS } from "./form-control-classes";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<React.ElementRef<"textarea">> {}

const Textarea = React.forwardRef<React.ElementRef<"textarea">, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground",
        FORM_CONTROL_SURFACE_CLASS,
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

export { Textarea };

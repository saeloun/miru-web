import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Input } from "./input";

export interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  animation?: "glow" | "bounce" | "slide";
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, animation = "glow", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const animations = {
      glow: {
        animate: isFocused
          ? {
              boxShadow: [
                "0 0 0 0 rgba(91, 52, 234, 0)",
                "0 0 0 3px rgba(91, 52, 234, 0.1)",
                "0 0 0 6px rgba(91, 52, 234, 0.05)",
              ],
            }
          : {},
        transition: { duration: 0.3 },
      },
      bounce: {
        animate: isFocused ? { scale: [1, 1.02, 1] } : {},
        transition: { duration: 0.2 },
      },
      slide: {
        initial: { x: -10, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.3 },
      },
    };

    const selectedAnimation = animations[animation];

    return (
      <motion.div
        initial={selectedAnimation.initial}
        animate={selectedAnimation.animate}
        transition={selectedAnimation.transition}
        className="w-full"
      >
        <Input
          ref={ref}
          className={cn(
            "transition-all duration-200",
            isFocused && "border-primary",
            className
          )}
          onFocus={e => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </motion.div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

export { AnimatedInput };

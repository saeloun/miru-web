import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Button, ButtonProps } from "./button";

interface AnimatedButtonProps extends ButtonProps {
  animation?: "scale" | "glow" | "bounce" | "pulse";
  loading?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, animation = "scale", loading, children, ...props }, ref) => {
    const animations = {
      scale: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: "spring", stiffness: 400, damping: 17 },
      },
      glow: {
        whileHover: {
          boxShadow: "0 0 20px rgba(91, 52, 234, 0.3)",
          transition: { duration: 0.3 },
        },
        whileTap: { scale: 0.98 },
      },
      bounce: {
        whileHover: { y: -2 },
        whileTap: { y: 0 },
        transition: { type: "spring", stiffness: 400, damping: 10 },
      },
      pulse: {
        animate: {
          scale: [1, 1.05, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "loop" as const,
          },
        },
      },
    };

    const selectedAnimation = animations[animation];

    return (
      <motion.div {...selectedAnimation} className="inline-block">
        <Button
          ref={ref}
          className={cn(className)}
          disabled={loading || props.disabled}
          {...props}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              />
              Loading...
            </div>
          ) : (
            children
          )}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };

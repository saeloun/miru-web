import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({
  label,
  error,
  className = "",
  autoResize = true,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHasContent(!!props.value);
  }, [props.value]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, autoResize]);

  const containerVariants = {
    initial: { scale: 0.98, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.3,
      },
    },
    focus: {
      scale: 1.01,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    hover: {
      scale: 1.005,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const textareaVariants = {
    initial: {
      borderColor: "oklch(0.8985 0.0078 286.38)",
      boxShadow: "none",
    },
    focus: {
      borderColor: "oklch(0.5016 0.2506 282.3585)",
      boxShadow: "0 0 0 3px oklch(0.5016 0.2506 282.3585 / 0.1)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    error: {
      borderColor: "oklch(0.6280 0.2007 17.3807)",
      boxShadow: "0 0 0 3px oklch(0.6280 0.2007 17.3807 / 0.1)",
    },
  };

  const labelVariants = {
    initial: {
      scale: 1,
      y: 0,
      color: "oklch(0.5584 0.014 286.38)",
    },
    focus: {
      scale: 0.85,
      y: -24,
      color: "oklch(0.5016 0.2506 282.3585)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    filled: {
      scale: 0.85,
      y: -24,
      color: "oklch(0.5584 0.014 286.38)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const errorVariants = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileFocus="focus"
      className="relative w-full"
    >
      <div className="relative">
        {label && (
          <motion.label
            variants={labelVariants}
            animate={
              isFocused || hasContent
                ? isFocused
                  ? "focus"
                  : "filled"
                : "initial"
            }
            className="absolute left-3 top-3 origin-left text-sm pointer-events-none z-10"
          >
            {label}
          </motion.label>
        )}
        <motion.textarea
          ref={textareaRef}
          variants={textareaVariants}
          animate={error ? "error" : isFocused ? "focus" : "initial"}
          className={cn(
            "w-full rounded-lg border bg-background px-3 py-3 text-sm transition-colors",
            "focus:outline-none resize-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "placeholder:text-muted-foreground",
            label && (isFocused || hasContent) && "pt-6 pb-2",
            label && !(isFocused || hasContent) && "pt-3 pb-3",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>

      {error && (
        <motion.p
          variants={errorVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mt-1 text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

export default AnimatedTextarea;

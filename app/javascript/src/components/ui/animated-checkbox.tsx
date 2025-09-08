import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "phosphor-react";
import { cn } from "../../lib/utils";

interface AnimatedCheckboxProps {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  label?: string;
  labelClassName?: string;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  id,
  checked = false,
  disabled = false,
  onCheckedChange,
  className = "",
  label,
  labelClassName = "",
}) => {
  const containerVariants = {
    initial: { scale: 0.9, opacity: 0 },
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
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const checkboxVariants = {
    unchecked: {
      backgroundColor: "transparent",
      borderColor: "hsl(var(--border))",
      scale: 1,
    },
    checked: {
      backgroundColor: "hsl(var(--primary))",
      borderColor: "hsl(var(--primary))",
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    disabled: {
      backgroundColor: "hsl(var(--muted))",
      borderColor: "hsl(var(--border))",
      opacity: 0.5,
    },
  };

  const checkVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      rotate: -90,
    },
    animate: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 20,
        delay: 0.1,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      rotate: 90,
      transition: {
        duration: 0.15,
      },
    },
  };

  const labelVariants = {
    initial: { opacity: 0.8 },
    hover: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    disabled: {
      opacity: 0.5,
    },
  };

  const rippleVariants = {
    initial: { scale: 0, opacity: 0.3 },
    animate: {
      scale: 4,
      opacity: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const handleChange = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  const getCheckboxState = () => {
    if (disabled) return "disabled";

    return checked ? "checked" : "unchecked";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      className={cn("flex items-center space-x-2", className)}
    >
      <div className="relative">
        <motion.button
          type="button"
          id={id}
          variants={checkboxVariants}
          animate={getCheckboxState()}
          disabled={disabled}
          className={cn(
            "relative h-5 w-5 rounded-md border-2 flex items-center justify-center overflow-hidden",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed",
            !disabled && "cursor-pointer"
          )}
          onClick={handleChange}
          aria-checked={checked}
          role="checkbox"
        >
          <AnimatePresence mode="wait">
            {checked && (
              <motion.div
                variants={checkVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check
                  className="h-3 w-3 text-white font-bold"
                  strokeWidth={3}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ripple effect */}
          {!disabled && (
            <motion.div
              className="absolute inset-0 rounded-md"
              variants={rippleVariants}
              initial="initial"
              whileTap="animate"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary)) 20%, transparent 20%)",
              }}
            />
          )}
        </motion.button>
      </div>

      {label && (
        <motion.label
          variants={labelVariants}
          initial="initial"
          whileHover={!disabled ? "hover" : undefined}
          animate={disabled ? "disabled" : "initial"}
          htmlFor={id}
          className={cn(
            "text-sm font-medium cursor-pointer select-none",
            disabled && "cursor-not-allowed text-muted-foreground",
            labelClassName
          )}
          onClick={handleChange}
        >
          {label}
        </motion.label>
      )}
    </motion.div>
  );
};

export default AnimatedCheckbox;

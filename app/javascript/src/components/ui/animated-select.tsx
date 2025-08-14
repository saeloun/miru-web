import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface AnimatedSelectProps {
  options: Array<{ value: string; label: string; id?: number }>;
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  options,
  value,
  placeholder = "Select an option",
  onChange,
  disabled = false,
  className = "",
  name,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const containerVariants = {
    initial: { scale: 0.95, opacity: 0 },
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
      scale: 1.02,
      borderColor: "oklch(0.5016 0.2506 282.3585)",
      boxShadow: "0 0 0 3px oklch(0.5016 0.2506 282.3585 / 0.1)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    hover: {
      scale: 1.01,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const dropdownVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
      },
    },
  };

  const optionVariants = {
    initial: { opacity: 0, x: -10 },
    animate: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.03,
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    }),
    hover: {
      backgroundColor: "oklch(0.5016 0.2506 282.3585 / 0.1)",
      x: 4,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const chevronVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 },
  };

  return (
    <div className={cn("relative", className)}>
      <motion.button
        type="button"
        name={name}
        id={id}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileFocus="focus"
        disabled={disabled}
        className={cn(
          "relative w-full cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <span
          className={cn(
            "block truncate",
            !selectedOption && "text-muted-foreground"
          )}
        >
          {selectedOption?.label || placeholder}
        </span>
        <motion.span
          variants={chevronVariants}
          animate={isOpen ? "open" : "closed"}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-lg ring-1 ring-black/5"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                variants={optionVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                custom={index}
                className={cn(
                  "relative w-full cursor-pointer select-none px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  selectedOption?.value === option.value &&
                    "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="block truncate">{option.label}</span>
                  {selectedOption?.value === option.value && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.span>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSelect;

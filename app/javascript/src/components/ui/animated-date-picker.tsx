import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { useOutsideClick } from "helpers";
import { Card } from "./card";

interface AnimatedDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode; // For the actual date picker component
}

const AnimatedDatePicker: React.FC<AnimatedDatePickerProps> = ({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className = "",
  disabled = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => {
    setIsOpen(false);
  });

  const buttonVariants = {
    initial: {
      scale: 0.98,
      opacity: 0,
    },
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
      scale: 1.01,
      y: -1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.99,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
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
  };

  const calendarVariants = {
    initial: {
      opacity: 0,
      scale: 0.9,
      y: -10,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -10,
      transition: {
        duration: 0.15,
      },
    },
  };

  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    hover: {
      rotate: 15,
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    tap: {
      rotate: -15,
      scale: 0.9,
    },
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.button
        type="button"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        whileFocus="focus"
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !date && "text-muted-foreground",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <motion.div variants={iconVariants} className="mr-2 h-4 w-4">
          <Calendar className="h-4 w-4" />
        </motion.div>
        <span className="flex-1 text-left">
          {date ? format(date, "do MMM, yyyy") : placeholder}
        </span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={calendarVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-12 z-50"
          >
            <Card className="p-0 shadow-lg">
              {children ? (
                React.cloneElement(children as React.ReactElement, {
                  onDateChange: (selectedDate: Date) => {
                    onDateChange(selectedDate);
                    setIsOpen(false);
                  },
                })
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  No date picker component provided
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedDatePicker;

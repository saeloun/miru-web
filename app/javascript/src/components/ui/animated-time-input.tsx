import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { CaretDownIcon } from "miruIcons";
import { cn } from "../../lib/utils";

// Validation functions
const isValidHHMM = (val: string): boolean => {
  const regexp = /^\d{0,2}?:?\d{0,2}$/;
  const valid = regexp.test(val);
  if (!valid) return false;

  const hours = Number(val.split(":")[0]);
  const minutes = val.split(":")[1];

  if (hours && hours > 23) return false;

  if (minutes && Number(minutes) > 59) return false;

  return true;
};

const isValidDecimal = (val: string): boolean => {
  const regexp = /^\d*\.?\d{0,2}$/;
  const valid = regexp.test(val);
  if (!valid) return false;

  const num = Number(val);

  return num >= 0 && num <= 24;
};

// Conversion utilities
const decimalToHHMM = (decimal: number): string => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

const hhmmToDecimal = (hhmm: string): number => {
  if (!hhmm || hhmm === "00:00") return 0;
  const [hours, minutes] = hhmm.split(":").map(Number);

  return hours + (minutes || 0) / 60;
};

const minutesToHHMM = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

const hhmmToMinutes = (hhmm: string): number => {
  if (!hhmm || hhmm === "00:00") return 0;
  const [hours, minutes] = hhmm.split(":").map(Number);

  return (hours || 0) * 60 + (minutes || 0);
};

// Common time slots for quick selection
const COMMON_TIME_SLOTS = [
  { label: "15 minutes", value: "00:15", minutes: 15 },
  { label: "30 minutes", value: "00:30", minutes: 30 },
  { label: "45 minutes", value: "00:45", minutes: 45 },
  { label: "1 hour", value: "01:00", minutes: 60 },
  { label: "1.5 hours", value: "01:30", minutes: 90 },
  { label: "2 hours", value: "02:00", minutes: 120 },
  { label: "3 hours", value: "03:00", minutes: 180 },
  { label: "4 hours", value: "04:00", minutes: 240 },
  { label: "6 hours", value: "06:00", minutes: 360 },
  { label: "8 hours", value: "08:00", minutes: 480 },
];

type InputMode = "hhmm" | "decimal" | "minutes";

interface AnimatedTimeInputProps {
  id?: string;
  autoFocus?: boolean;
  initTime?: string;
  disabled?: boolean;
  onTimeChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  allowModeSwitch?: boolean;
  defaultMode?: InputMode;
  label?: string;
  error?: string;
}

const AnimatedTimeInput: React.FC<AnimatedTimeInputProps> = ({
  autoFocus = false,
  initTime = "00:00",
  disabled = false,
  onTimeChange,
  placeholder,
  className = "",
  name,
  id,
  allowModeSwitch = false,
  defaultMode = "hhmm",
  label,
  error,
}) => {
  const [mode, setMode] = useState<InputMode>(defaultMode);
  const [time, setTime] = useState<string>(initTime);
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize display value based on mode
  useEffect(() => {
    if (initTime && initTime !== "00:00") {
      setTime(initTime);
      updateDisplayValue(initTime, mode);
    }
  }, [initTime, mode]);

  const updateDisplayValue = (timeValue: string, currentMode: InputMode) => {
    if (!timeValue || timeValue === "00:00") {
      setDisplayValue("");

      return;
    }

    switch (currentMode) {
      case "hhmm":
        setDisplayValue(timeValue);
        break;
      case "decimal": {
        const decimal = hhmmToDecimal(timeValue);
        setDisplayValue(decimal > 0 ? decimal.toString() : "");
        break;
      }
      case "minutes": {
        const minutes = hhmmToMinutes(timeValue);
        setDisplayValue(minutes > 0 ? minutes.toString() : "");
        break;
      }
    }
  };

  const convertToHHMM = (value: string, fromMode: InputMode): string => {
    if (!value) return "00:00";

    switch (fromMode) {
      case "hhmm":
        return value;
      case "decimal": {
        const decimal = Number(value);

        return decimalToHHMM(decimal);
      }
      case "minutes": {
        const minutes = Number(value);

        return minutesToHHMM(minutes);
      }
      default:
        return "00:00";
    }
  };

  const validateInput = (val: string, currentMode: InputMode): boolean => {
    if (!val) return true;

    switch (currentMode) {
      case "hhmm":
        return isValidHHMM(val);
      case "decimal":
        return isValidDecimal(val);
      case "minutes": {
        const num = Number(val);

        return !isNaN(num) && num >= 0 && num <= 1440; // 24 hours = 1440 minutes
      }
      default:
        return false;
    }
  };

  const formatInput = (val: string, currentMode: InputMode): string => {
    if (currentMode === "hhmm" && val.length === 2 && !val.includes(":")) {
      return `${val}:`;
    }

    return val;
  };

  const onChangeHandler = (val: string) => {
    if (validateInput(val, mode)) {
      const formattedVal = formatInput(val, mode);

      if (mode === "hhmm" && formattedVal.length > 5) {
        return;
      }

      setDisplayValue(formattedVal);

      // Convert to HH:MM format for the callback
      const hhmmValue = convertToHHMM(formattedVal, mode);
      setTime(hhmmValue);
      onTimeChange?.(hhmmValue);
    }
  };

  const switchMode = (newMode: InputMode) => {
    setMode(newMode);
    updateDisplayValue(time, newMode);
  };

  const handleQuickSelect = (selectedTime: string) => {
    setTime(selectedTime);
    updateDisplayValue(selectedTime, mode);
    onTimeChange?.(selectedTime);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Element)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;

    switch (mode) {
      case "hhmm":
        return "e.g. 1:30";
      case "decimal":
        return "e.g. 1.5";
      case "minutes":
        return "e.g. 90";
      default:
        return "e.g. 1:30";
    }
  };

  const getSuffix = () => {
    switch (mode) {
      case "hhmm":
        return "h:m";
      case "decimal":
        return "hrs";
      case "minutes":
        return "min";
      default:
        return "h:m";
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { scale: 0.98, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
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

  const inputVariants = {
    initial: {
      borderColor: "#e5e7eb",
      boxShadow: "none",
    },
    focus: {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    error: {
      borderColor: "#ef4444",
      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)",
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
    focus: {
      rotate: 0,
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  };

  const modeButtonVariants = {
    initial: { scale: 1, opacity: 0.7 },
    hover: {
      scale: 1.05,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
    active: {
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const suffixVariants = {
    initial: { opacity: 0, scale: 0.8, x: -10 },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: -10,
      transition: { duration: 0.15 },
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
        delay: i * 0.02,
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    }),
    hover: {
      backgroundColor: "#f3f4f6",
      x: 4,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover={!disabled ? "hover" : undefined}
      whileFocus="focus"
      className="relative w-full"
    >
      {label && (
        <motion.label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative w-full">
        <motion.div
          variants={inputVariants}
          animate={error ? "error" : isFocused ? "focus" : "initial"}
          className="relative flex items-center w-full"
        >
          <motion.div
            variants={iconVariants}
            animate={isFocused ? "focus" : "initial"}
            whileHover={!disabled ? "hover" : undefined}
            className="absolute left-3 z-10"
          >
            <Clock className="h-4 w-4 text-muted-foreground" />
          </motion.div>

          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            value={displayValue}
            placeholder={getPlaceholder()}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              "flex h-10 w-full rounded-md border bg-background pl-10 py-2 text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "pr-8", // Reserve space for dropdown button
              className
            )}
            onChange={e => onChangeHandler(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {/* Show suffix only when dropdown is closed */}
          {!isDropdownOpen && (
            <AnimatePresence mode="wait">
              <motion.span
                key={getSuffix()}
                variants={suffixVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute right-8 text-xs font-medium text-muted-foreground pointer-events-none"
              >
                {getSuffix()}
              </motion.span>
            </AnimatePresence>
          )}

          {/* Dropdown toggle button */}
          <motion.button
            type="button"
            disabled={disabled}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center",
              "text-muted-foreground hover:text-foreground transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "z-10" // Ensure button is above other elements
            )}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) {
                setIsDropdownOpen(!isDropdownOpen);
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CaretDownIcon size={12} weight="bold" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Quick select dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute top-full mt-1 left-0 right-0 z-[99999] max-h-60 overflow-auto rounded-lg border bg-white shadow-xl ring-1 ring-black/5"
            >
              <div className="p-1">
                {COMMON_TIME_SLOTS.map((slot, index) => (
                  <motion.button
                    key={slot.value}
                    type="button"
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    custom={index}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-md transition-colors",
                      "hover:bg-gray-100 hover:text-gray-900",
                      "focus:bg-gray-100 focus:text-gray-900 focus:outline-none"
                    )}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuickSelect(slot.value);
                    }}
                  >
                    <span>{slot.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {slot.value}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {allowModeSwitch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-1 mt-2"
          >
            {(["hhmm", "decimal", "minutes"] as const).map(modeOption => (
              <motion.button
                key={modeOption}
                type="button"
                variants={modeButtonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="active"
                disabled={disabled}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-colors",
                  mode === modeOption
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => switchMode(modeOption)}
              >
                {modeOption === "hhmm" && "HH:MM"}
                {modeOption === "decimal" && "Hours"}
                {modeOption === "minutes" && "Minutes"}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="mt-1 text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}

      {/* Always show minutes summary for clarity */}
      {time && time !== "00:00" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-1 text-xs text-muted-foreground"
        >
          {mode !== "hhmm" && `= ${time} • `}
          {hhmmToMinutes(time)} minutes total
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedTimeInput;

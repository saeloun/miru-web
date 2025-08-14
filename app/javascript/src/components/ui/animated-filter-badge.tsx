import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface AnimatedFilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
  filterKey?: string;
  index?: number;
}

const AnimatedFilterBadge: React.FC<AnimatedFilterBadgeProps> = ({
  label,
  value,
  onRemove,
  filterKey,
  index = 0,
}) => {
  const badgeVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      y: 20,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
        delay: index * 0.05,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const closeButtonVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    hover: {
      scale: 1.2,
      opacity: 1,
      rotate: 90,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    tap: { scale: 0.9 },
  };

  return (
    <motion.li
      variants={badgeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      layout
      className="inline-flex items-center gap-1.5 rounded-full bg-miru-han-purple-1000 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
    >
      <span className="whitespace-nowrap">
        {filterKey === "groupBy" && (
          <span className="text-white opacity-80">Group By:</span>
        )}{" "}
        {value}
      </span>
      <motion.button
        variants={closeButtonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3 text-white" />
      </motion.button>
    </motion.li>
  );
};

export default AnimatedFilterBadge;

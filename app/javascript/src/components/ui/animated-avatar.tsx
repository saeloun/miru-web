import React from "react";
import { motion } from "framer-motion";
import { NavAvatarSVG } from "miruIcons";

interface AnimatedAvatarProps {
  url?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animation?: "scale" | "rotate" | "pulse" | "bounce" | "morph";
  className?: string;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  url = "",
  name = "",
  size = "md",
  animation = "scale",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl",
  };

  const getInitials = (name: string) => {
    const parts = name.match(/\b(\w)/g);
    if (parts) {
      return parts.join("").slice(0, 2).toUpperCase();
    }

    return "";
  };

  const animations = {
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      whileHover: { scale: 1.05 },
      transition: { type: "spring", stiffness: 400, damping: 17 },
    },
    rotate: {
      initial: { rotate: -180, opacity: 0 },
      animate: { rotate: 0, opacity: 1 },
      whileHover: { rotate: 10 },
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
    pulse: {
      initial: { scale: 0.95, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
      },
      whileHover: {
        scale: [1, 1.05, 1],
        transition: {
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      },
      transition: { duration: 0.3 },
    },
    bounce: {
      initial: { y: -20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      whileHover: {
        y: [-2, 2, -2],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      },
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    morph: {
      initial: { borderRadius: "50%", scale: 0.8, opacity: 0 },
      animate: { borderRadius: "50%", scale: 1, opacity: 1 },
      whileHover: {
        borderRadius: ["50%", "30%", "50%"],
        transition: {
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      },
      transition: { duration: 0.4 },
    },
  };

  const animationConfig = animations[animation];
  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];
  const textSize = textSizes[size];

  // Generate a consistent color based on name
  const getColorFromName = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-400 to-blue-600",
      "bg-gradient-to-br from-green-400 to-green-600",
      "bg-gradient-to-br from-purple-400 to-purple-600",
      "bg-gradient-to-br from-pink-400 to-pink-600",
      "bg-gradient-to-br from-yellow-400 to-yellow-600",
      "bg-gradient-to-br from-indigo-400 to-indigo-600",
      "bg-gradient-to-br from-red-400 to-red-600",
      "bg-gradient-to-br from-teal-400 to-teal-600",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  if (url) {
    return (
      <motion.div
        className={`relative ${sizeClass} ${className}`}
        initial={animationConfig.initial}
        animate={animationConfig.animate}
        whileHover={animationConfig.whileHover}
        transition={animationConfig.transition}
      >
        <img
          src={url}
          alt={name || "Avatar"}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-lg`}
        />
        <motion.div
          className="absolute inset-0 rounded-full ring-2 ring-miru-han-purple-400 ring-opacity-0"
          whileHover={{ ringOpacity: 0.5 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    );
  }

  if (initials) {
    return (
      <motion.div
        className={`relative ${sizeClass} ${className}`}
        initial={animationConfig.initial}
        animate={animationConfig.animate}
        whileHover={animationConfig.whileHover}
        transition={animationConfig.transition}
      >
        <div
          className={`${sizeClass} ${getColorFromName(
            name
          )} rounded-full flex items-center justify-center shadow-lg ring-2 ring-white`}
        >
          <span className={`${textSize} font-semibold text-white`}>
            {initials}
          </span>
        </div>
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ boxShadow: "0 0 0 0px rgba(139, 92, 246, 0.4)" }}
          whileHover={{
            boxShadow: "0 0 0 8px rgba(139, 92, 246, 0.1)",
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    );
  }

  // Default avatar
  return (
    <motion.div
      className={`relative ${sizeClass} ${className}`}
      initial={animationConfig.initial}
      animate={animationConfig.animate}
      whileHover={animationConfig.whileHover}
      transition={animationConfig.transition}
    >
      <div
        className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center`}
      >
        <img
          src={NavAvatarSVG}
          alt="Default Avatar"
          className={`${sizeClass} rounded-full p-2`}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedAvatar;

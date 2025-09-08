import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: "fadeIn" | "slideUp" | "slideIn" | "zoom";
  delay?: number;
  duration?: number;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      className,
      animation = "fadeIn",
      delay = 0,
      duration = 0.5,
      children,
      ...props
    },
    ref
  ) => {
    const animations = {
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration, delay },
      },
      slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
      slideIn: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
      zoom: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
    };

    const selectedAnimation = animations[animation];

    return (
      <motion.div
        ref={ref}
        initial={selectedAnimation.initial}
        animate={selectedAnimation.animate}
        transition={selectedAnimation.transition}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={cn("transition-shadow hover:shadow-lg", className)}
        {...props}
      >
        <Card className="h-full">{children}</Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export {
  AnimatedCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

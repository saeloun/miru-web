import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: "fadeIn" | "slideUp" | "slideInLeft" | "slideInRight";
  delay?: number;
  duration?: number;
  stagger?: boolean;
}

const AnimatedSection = React.forwardRef<HTMLDivElement, AnimatedSectionProps>(
  (
    {
      className,
      animation = "fadeIn",
      delay = 0,
      duration = 0.5,
      stagger = false,
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
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
      slideInLeft: {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
      slideInRight: {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration, delay, type: "spring", stiffness: 100 },
      },
    };

    const selectedAnimation = animations[animation];

    if (stagger && React.Children.count(children) > 1) {
      return (
        <motion.div
          ref={ref}
          className={cn(className)}
          initial="initial"
          animate="animate"
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: delay,
              },
            },
          }}
          {...props}
        >
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={{
                initial: selectedAnimation.initial,
                animate: selectedAnimation.animate,
              }}
              transition={selectedAnimation.transition}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={selectedAnimation.initial}
        animate={selectedAnimation.animate}
        transition={selectedAnimation.transition}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedSection.displayName = "AnimatedSection";

export { AnimatedSection };

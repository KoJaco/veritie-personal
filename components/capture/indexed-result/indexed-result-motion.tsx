"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const indexedStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const indexedStaggerItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
};

export function IndexedResultAnimatedSection({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"section"> & {
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.38, delay, ease: EASE_OUT }
      }
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function useEntranceAnimationEnabled(
  enabled: boolean,
  ready: boolean,
): boolean {
  return enabled && ready;
}

export function IndexedResultStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={reduceMotion ? undefined : indexedStaggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function IndexedResultStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={indexedStaggerItem}>
      {children}
    </motion.div>
  );
}

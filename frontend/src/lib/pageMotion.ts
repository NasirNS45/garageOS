import type { Transition, Variants } from "framer-motion";

/** Shared easing — smooth deceleration for page/tab transitions. */
export const pageEase = [0.16, 1, 0.3, 1] as const;

export const pageTransition: Transition = {
  duration: 0.28,
  ease: pageEase,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const routeVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const routeTransition: Transition = {
  duration: 0.32,
  ease: pageEase,
};

/** Sidebar width / content offset transition class. */
export const layoutTransitionClass =
  "transition-[width,margin,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

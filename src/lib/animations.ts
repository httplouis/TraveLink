/**
 * iOS-Inspired Animation System for Travelink
 * Consistent animations across all components
 */

import { Transition, Variants } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════════
// MODAL ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const modalVariants: Variants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ═══════════════════════════════════════════════════════════════════════
// CARD ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// BUTTON ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const buttonTapAnimation = {
  scale: 0.95,
  transition: {
    duration: 0.1,
  },
};

export const buttonHoverAnimation = {
  scale: 1.02,
  transition: {
    duration: 0.15,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// LIST ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// FORM ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const inputFocusVariants: Variants = {
  blur: {
    scale: 1,
  },
  focus: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export const errorShakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

export const successCheckVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// PAGE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SKELETON LOADER SHIMMER
// ═══════════════════════════════════════════════════════════════════════

export const shimmerVariants: Variants = {
  shimmer: {
    x: ["-100%", "100%"],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SLIDE ANIMATIONS (for panels, drawers)
// ═══════════════════════════════════════════════════════════════════════

export const slideInVariants = {
  left: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  },
  top: {
    hidden: { y: "-100%" },
    visible: { y: 0 },
    exit: { y: "-100%" },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  },
};

// ═══════════════════════════════════════════════════════════════════════
// FADE ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SPRING CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════

export const springConfigs = {
  gentle: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15,
  },
  responsive: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  },
  slow: {
    type: "spring" as const,
    stiffness: 50,
    damping: 20,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// EASING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

export const easings = {
  // iOS-style easing
  ios: [0.68, -0.55, 0.265, 1.55],
  
  // Standard easings
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  
  // Custom easings
  smooth: [0.25, 0.1, 0.25, 1],
  sharp: [0.4, 0.0, 0.6, 1],
};

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create a stagger animation for list items
 */
export function createStaggerAnimation(staggerDelay = 0.05): Transition {
  return {
    staggerChildren: staggerDelay,
  };
}

/**
 * Create a delayed animation
 */
export function createDelayedAnimation(delay: number): Transition {
  return {
    delay,
    duration: 0.3,
    ease: "easeOut",
  };
}

/**
 * Bounce animation for notifications/toasts
 */
export const bounceVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: [0, 1.1, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
      ease: "easeOut",
    },
  },
};

/**
 * Pulse animation for attention-grabbing elements
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
    },
  },
};

/**
 * Rotate animation for loading spinners
 */
export const rotateVariants: Variants = {
  rotate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "linear",
    },
  },
};

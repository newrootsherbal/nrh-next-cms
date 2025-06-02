// Animation variant definitions
// These can be expanded and customized for different routes or animation styles.

export const defaultPageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } },
};

// Example: Slide from right for public pages
export const slideFromRightVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }, // Smoother easing
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
};

// Example: Scale + fade for CMS pages
export const scaleFadeVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { scale: 1.05, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

// Example: Gentle fade for auth pages
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

// Example: Scale up for modal-like pages
export const scaleUpVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.3, type: "spring", stiffness: 150, damping: 20 } },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

// You can add more variants here as needed, e.g., slide from left, slide up/down, etc.

export const slideFromLeftVariants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } },
};

// Add a simple "none" variant for cases where no transition is desired
export const noTransitionVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

// Function to select variants based on route or other conditions
// This is a placeholder and will need to be implemented based on routing logic
export const getVariantsForPath = (pathname: string) => {
  if (pathname.startsWith('/cms')) {
    return scaleFadeVariants;
  }
  if (pathname.startsWith('/auth')) {
    return fadeVariants;
  }
  // Add more conditions for other paths
  // e.g. if (pathname.startsWith('/blog')) return slideFromLeftVariants;
  return defaultPageVariants; // Fallback to default
};
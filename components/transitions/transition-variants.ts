// Transition properties for react-transition-group
// These define classNames prefixes and timeouts for CSSTransition

export interface TransitionEffect {
  classNames: string; // Prefix for CSS classes (e.g., "fade", "slide-right")
  timeout: number | { enter: number; exit: number; appear?: number }; // Duration of the transition
}

export const defaultPageTransitionProps: TransitionEffect = {
  classNames: 'fade-up-down', // Default transition: fade with slight vertical movement
  timeout: 300, // Corresponds to framer-motion's 0.3s duration
};

export const slideFromRightTransitionProps: TransitionEffect = {
  classNames: 'slide-horizontal',
  timeout: { enter: 400, exit: 300 },
};

export const scaleFadeTransitionProps: TransitionEffect = {
  classNames: 'scale-fade',
  timeout: { enter: 300, exit: 250 },
};

export const fadeTransitionProps: TransitionEffect = {
  classNames: 'fade',
  timeout: { enter: 400, exit: 300 },
};

// For scaleUp, we'll use a CSS scale and fade. Spring physics are harder to replicate directly.
// We can approximate with ease-out for enter and ease-in for exit.
export const scaleUpTransitionProps: TransitionEffect = {
  classNames: 'scale-up-fade',
  timeout: { enter: 300, exit: 250 },
};

export const slideFromLeftTransitionProps: TransitionEffect = {
  classNames: 'slide-horizontal-reverse', // Assuming CSS will handle direction
  timeout: { enter: 400, exit: 300 },
};

export const noTransitionProps: TransitionEffect = {
  classNames: 'no-transition', // Will have CSS that applies no actual transition
  timeout: 0, // No duration
};

// Function to select transition properties based on route
export const getTransitionPropsForPath = (pathname: string): TransitionEffect => {
  if (pathname.startsWith('/cms')) {
    return scaleFadeTransitionProps;
  }
  if (pathname.startsWith('/auth')) {
    return fadeTransitionProps;
  }
  if (pathname.startsWith('/blog')) { // Example for blog
    return slideFromLeftTransitionProps;
  }
  // Add more conditions for other paths
  return defaultPageTransitionProps; // Fallback to default
};
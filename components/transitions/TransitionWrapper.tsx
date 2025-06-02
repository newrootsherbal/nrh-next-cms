"use client";

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePageTransition } from './PageTransitionProvider';
import { getVariantsForPath, defaultPageVariants } from './transition-variants'; // Import new items


interface TransitionWrapperProps {
  children: ReactNode;
  // Allow passing custom variants for specific pages/layouts as an override
  customVariants?: ReturnType<typeof getVariantsForPath>;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children, customVariants }) => {
  const pathname = usePathname();
  const { setTransitioning } = usePageTransition();

  const variantsToUse = customVariants || getVariantsForPath(pathname) || defaultPageVariants;

  return (
    <motion.div
      key={pathname} // Crucial for AnimatePresence to detect route changes
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variantsToUse}
      // transition prop can be part of variants definition or a default here
      // If variants define their own transition, it will override this.
      // Default transition if not specified in variant:
      transition={variantsToUse.animate?.transition || variantsToUse.exit?.transition || { duration: 0.3, ease: "easeInOut" }}
      onAnimationStart={() => setTransitioning(true)}
      // onAnimationComplete is handled by AnimatePresence's onExitComplete in the provider
    >
      {children}
    </motion.div>
  );
};
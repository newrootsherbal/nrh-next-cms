"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionContextProps {
  isTransitioning: boolean;
  setTransitioning: (isTransitioning: boolean) => void;
}

const PageTransitionContext = createContext<PageTransitionContextProps | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};

interface PageTransitionProviderProps {
  children: ReactNode;
}

export const PageTransitionProvider: React.FC<PageTransitionProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const [isTransitioning, setTransitioning] = useState(false);

  // Basic example: end transition after a short delay or on new pathname
  // More sophisticated logic might be needed depending on animation complexity
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setTransitioning(false), 500); // Adjust timeout based on animation duration
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, pathname]);

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, setTransitioning }}>
      <AnimatePresence mode="wait" onExitComplete={() => setTransitioning(false)}>
        {children}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
};
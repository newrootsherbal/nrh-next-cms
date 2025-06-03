"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { TransitionGroup } from 'react-transition-group'; // No longer renders TransitionGroup
// import { usePathname } from 'next/navigation'; // No longer directly uses pathname for its own logic

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
  // const pathname = usePathname(); // Pathname is now used by TransitionWrapper/CSSTransition key
  const [isTransitioning, setTransitioning] = useState(false);

  // This useEffect for automatically ending the transition might still be useful,
  // or it could be moved/managed closer to where CSSTransition's onEntered/onExited are.
  // For now, let's keep it here. If CSSTransition's onEntered/onExited reliably
  // setTransitioning(false), this might become redundant or a fallback.
  useEffect(() => {
    if (isTransitioning) {
      // This timeout should ideally be longer than or equal to the longest exit animation.
      const timer = setTimeout(() => {
        // console.log("PageTransitionProvider: Fallback timer setting transitioning to false");
        setTransitioning(false);
      }, 700); // Increased timeout, adjust based on actual animation durations
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, setTransitioning }}>
      {children}
    </PageTransitionContext.Provider>
  );
};
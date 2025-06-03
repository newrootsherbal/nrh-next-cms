"use client";

import React, { ReactNode } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { usePathname } from 'next/navigation';
import { usePageTransition } from './PageTransitionProvider';
import { getTransitionPropsForPath, defaultPageTransitionProps, TransitionEffect } from './transition-variants';

interface ClientOnlyTransitionOrchestratorProps {
  children: ReactNode; // This will be the direct page children from app/layout.tsx
  // customTransitionProps?: TransitionEffect; // This could be added back if needed per-page
}

export const ClientOnlyTransitionOrchestrator: React.FC<ClientOnlyTransitionOrchestratorProps> = ({ children /*, customTransitionProps */ }) => {
  const pathname = usePathname();
  const { setTransitioning } = usePageTransition();
  const nodeRef = React.useRef(null); // Create a ref for each CSSTransition instance

  // const transitionPropsToUse = customTransitionProps || getTransitionPropsForPath(pathname) || defaultPageTransitionProps;
  // For now, let's always use getTransitionPropsForPath or default. Custom props can be added later if needed.
  const transitionPropsToUse = getTransitionPropsForPath(pathname) || defaultPageTransitionProps;

  // The direct child of TransitionGroup must be the CSSTransition component.
  // The 'children' prop passed to ClientOnlyTransitionOrchestrator is the actual page content.
  // We wrap this page content with CSSTransition.
  // The key on CSSTransition is crucial for TransitionGroup to detect changes.
  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={pathname}
        nodeRef={nodeRef} // Use the ref
        timeout={transitionPropsToUse.timeout}
        classNames={transitionPropsToUse.classNames}
        onEnter={() => setTransitioning(true)}
        onEntering={() => setTransitioning(true)}
        onEntered={() => setTransitioning(false)}
        onExit={() => setTransitioning(true)}
        onExiting={() => setTransitioning(true)}
        onExited={() => setTransitioning(false)}
        unmountOnExit // This is important to remove old page content from the DOM
        // appear // Can be re-added if initial mount animation is desired and working
      >
        {/* The CSSTransition component expects a single child function or a single React element.
            The child function receives the status and a ref.
            Alternatively, if we provide a React element, we must pass the nodeRef to it.
            The 'children' here is the actual page content.
            We need a wrapper div for the nodeRef if children itself isn't a single element
            that can take a ref. The original TransitionWrapper had a div.
        */}
        <div ref={nodeRef} className="page-transition-wrapper">
          {children}
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};
"use client";

import React, { ReactNode, forwardRef } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import { usePageTransition } from './PageTransitionProvider';

interface AnimatedLinkProps extends Omit<LinkProps, 'onClick'> { // Omit LinkProps' onClick
  children: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void; // Define our own onClick
  target?: React.HTMLAttributeAnchorTarget; // Explicitly add target
  rel?: string; // Explicitly add rel
  // Add any other props you might need for styling or functionality
}

// eslint-disable-next-line react/display-name
export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  ({ children, href, className, onClick, target, rel, ...props }, ref) => { // Destructure onClick, target, rel
    const router = useRouter();
    const { setTransitioning, isTransitioning } = usePageTransition();

    const handleAnimatedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick if it exists
      if (onClick) {
        onClick(e);
      }

      // If onClick already handled prevention or if it's a hash link/already transitioning
      if (e.defaultPrevented || isTransitioning || (typeof href === 'string' && href.startsWith('#'))) {
        // If already transitioning and it's not a hash link, still prevent default to avoid double nav
        if (isTransitioning && !(typeof href === 'string' && href.startsWith('#'))) {
            e.preventDefault();
        }
        return;
      }

      e.preventDefault(); // Prevent default link behavior to manage transition
      setTransitioning(true);
      
      // Wait for a brief moment to allow exit animation to start before navigating
      setTimeout(() => {
        router.push(href.toString());
      }, 50); // Small delay, adjust as needed
    };

    return (
      <Link href={href} onClick={handleAnimatedClick} className={className} target={target} rel={rel} {...props} ref={ref}>
        {children}
      </Link>
    );
  }
);
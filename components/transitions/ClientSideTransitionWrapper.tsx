"use client";

import dynamic from "next/dynamic";
import React from "react";

// Define props for PageTransitionProvider
interface PageTransitionProviderProps {
  children: React.ReactNode;
}

// Define props for ClientOnlyTransitionOrchestrator
interface ClientOnlyTransitionOrchestratorProps {
  children: React.ReactNode;
}

const DynamicPageTransitionProvider = dynamic<PageTransitionProviderProps>(
  () =>
    import("./PageTransitionProvider").then(
      (mod) => mod.PageTransitionProvider
    ),
  { ssr: false }
);

const DynamicClientOnlyTransitionOrchestrator =
  dynamic<ClientOnlyTransitionOrchestratorProps>(
    () =>
      import("./ClientOnlyTransitionOrchestrator").then(
        (mod) => mod.ClientOnlyTransitionOrchestrator
      ),
    { ssr: false }
  );

interface ClientSideTransitionWrapperProps {
  children: React.ReactNode;
}

const ClientSideTransitionWrapper: React.FC<
  ClientSideTransitionWrapperProps
> = ({ children }) => {
  return (
    <DynamicPageTransitionProvider>
      <DynamicClientOnlyTransitionOrchestrator>
        {children}
      </DynamicClientOnlyTransitionOrchestrator>
    </DynamicPageTransitionProvider>
  );
};

export default ClientSideTransitionWrapper;
"use client";

import dynamic from 'next/dynamic';

export const DynamicClientSideTransitionWrapper = dynamic(
  () => import('./transitions/ClientSideTransitionWrapper'),
  { ssr: false }
);

export const DynamicThemeSwitcher = dynamic(
  () => import('./theme-switcher').then(mod => mod.ThemeSwitcher),
  { ssr: false }
);
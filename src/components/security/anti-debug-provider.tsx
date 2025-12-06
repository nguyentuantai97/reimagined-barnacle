'use client';

import { useEffect } from 'react';
import { initAntiDebug } from '@/lib/anti-debug';

/**
 * AntiDebugProvider - Initializes anti-debug protection
 * Place this component in your root layout
 */
export function AntiDebugProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize anti-debug protection in production
    initAntiDebug({
      disableRightClick: false, // Keep disabled - bad UX
      disableShortcuts: true,   // Block F12, Ctrl+Shift+I, etc.
      disableSelection: false,  // Keep disabled - bad UX
      showWarning: true,        // Show warning in console
    });
  }, []);

  return <>{children}</>;
}

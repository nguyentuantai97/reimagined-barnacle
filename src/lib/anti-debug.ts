/**
 * Anti-Debug & DevTools Protection
 * Prevents inspection and debugging in production
 */

// Only run in production and on client side
const isProduction = process.env.NODE_ENV === 'production';
const isClient = typeof window !== 'undefined';

/**
 * Disable React DevTools
 */
export function disableReactDevTools(): void {
  if (!isClient || !isProduction) return;

  // Disable React DevTools
  if (typeof (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
    const devTools = (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: Record<string, unknown> }).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    // Replace all DevTools functions with no-ops
    for (const key in devTools) {
      if (typeof devTools[key] === 'function') {
        devTools[key] = () => {};
      }
    }
  }
}

/**
 * Disable right-click context menu
 */
export function disableContextMenu(): void {
  if (!isClient || !isProduction) return;

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
}

/**
 * Disable keyboard shortcuts for DevTools
 * F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
 */
export function disableDevToolsShortcuts(): void {
  if (!isClient || !isProduction) return;

  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault();
      return false;
    }
  });
}

/**
 * Clear console messages in production
 */
export function clearConsoleLogs(): void {
  if (!isClient || !isProduction) return;

  // Override console methods to prevent information leakage
  const noop = () => {};

  // Keep console.error for critical issues
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  console.table = noop;
  console.dir = noop;
  console.trace = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.count = noop;
  console.assert = noop;
}

/**
 * Detect DevTools open (basic detection)
 * Note: This is not foolproof, determined users can bypass
 */
export function detectDevTools(callback?: () => void): void {
  if (!isClient || !isProduction) return;

  const threshold = 160;

  const check = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      callback?.();
    }
  };

  // Check periodically
  setInterval(check, 1000);
  window.addEventListener('resize', check);
}

/**
 * Add warning message to console
 */
export function addConsoleWarning(): void {
  if (!isClient || !isProduction) return;

  // Add a visible warning to the console
  setTimeout(() => {
    console.log(
      '%c⚠️ CẢNH BÁO!',
      'color: red; font-size: 40px; font-weight: bold;'
    );
    console.log(
      '%cĐây là tính năng dành cho nhà phát triển. Nếu ai đó yêu cầu bạn sao chép/dán bất cứ thứ gì ở đây, đó là hành vi lừa đảo và bạn có thể bị đánh cắp thông tin.',
      'color: black; font-size: 16px;'
    );
  }, 100);
}

/**
 * Disable text selection (optional, can be annoying for users)
 */
export function disableTextSelection(): void {
  if (!isClient || !isProduction) return;

  document.addEventListener('selectstart', (e) => {
    // Allow selection in form inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
    return false;
  });
}

/**
 * Initialize all anti-debug protections
 * Call this in your root layout or _app
 */
export function initAntiDebug(options?: {
  disableRightClick?: boolean;
  disableShortcuts?: boolean;
  disableSelection?: boolean;
  showWarning?: boolean;
  onDevToolsOpen?: () => void;
}): void {
  if (!isClient || !isProduction) return;

  const {
    disableRightClick = false, // Disabled by default (can be annoying)
    disableShortcuts = true,
    disableSelection = false,
    showWarning = true,
    onDevToolsOpen,
  } = options || {};

  // Always run these
  disableReactDevTools();
  clearConsoleLogs();

  // Optional features
  if (disableRightClick) disableContextMenu();
  if (disableShortcuts) disableDevToolsShortcuts();
  if (disableSelection) disableTextSelection();
  if (showWarning) addConsoleWarning();
  if (onDevToolsOpen) detectDevTools(onDevToolsOpen);
}

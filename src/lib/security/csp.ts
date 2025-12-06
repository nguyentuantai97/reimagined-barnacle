/**
 * Content Security Policy (CSP)
 * Ngăn chặn XSS, clickjacking, data injection attacks
 */

export function getCSPHeader(): string {
  const cspDirectives = [
    // Default: chỉ cho phép tài nguyên từ cùng origin
    "default-src 'self'",

    // Scripts: chỉ cho phép self + inline scripts (cần cho Next.js)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",

    // Styles: cho phép self + inline styles (cần cho Tailwind)
    "style-src 'self' 'unsafe-inline'",

    // Images: cho phép self + data URIs + external CDNs
    "img-src 'self' data: https: blob:",

    // Fonts: chỉ cho phép self + data URIs
    "font-src 'self' data:",

    // Connect (API calls): chỉ cho phép self + CUKCUK API
    "connect-src 'self' https://graphapi.cukcuk.vn https://*.cukcuk.vn https://vitals.vercel-insights.com",

    // Frame: không cho phép nhúng trong iframe
    "frame-ancestors 'none'",

    // Form actions: chỉ cho phép submit đến self
    "form-action 'self'",

    // Base URI: ngăn chặn base tag injection
    "base-uri 'self'",

    // Object/Embed: không cho phép
    "object-src 'none'",

    // Media: cho phép self
    "media-src 'self'",

    // Worker: cho phép self
    "worker-src 'self' blob:",

    // Manifest: cho phép self
    "manifest-src 'self'",

    // Upgrade insecure requests to HTTPS
    "upgrade-insecure-requests",

    // Block mixed content
    "block-all-mixed-content",
  ];

  return cspDirectives.join('; ');
}

/**
 * Permissions Policy (formerly Feature Policy)
 * Kiểm soát các tính năng trình duyệt
 */
export function getPermissionsPolicyHeader(): string {
  const policies = [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'cross-origin-isolated=()',
    'display-capture=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'geolocation=(self)', // Cần cho tính phí ship
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()', // Chặn Payment Request API
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=(self)',
    'xr-spatial-tracking=()',
  ];

  return policies.join(', ');
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCSPHeader, getPermissionsPolicyHeader } from '@/lib/security/csp';
import { autoHealingSystem, recordSecurityIncident } from '@/lib/security/auto-heal';

// ============================================
// Configuration
// ============================================

const RATE_LIMIT_CONFIG = {
  '/api/orders': { maxRequests: 5, windowMs: 60 * 1000, blockMs: 5 * 60 * 1000 }, // 5 orders/min, block 5 min
  '/api/distance': { maxRequests: 20, windowMs: 60 * 1000 }, // 20 distance checks/min
  '/api/menu': { maxRequests: 30, windowMs: 60 * 1000 }, // 30 menu requests/min
} as const;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://www.anmilktea.online',
  'https://anmilktea.online',
  'https://an-milk-tea.vercel.app',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

// Known malicious patterns
const MALICIOUS_PATTERNS = [
  // SQL Injection
  /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bexec\b).*(\bfrom\b|\binto\b|\btable\b)/i,
  /('\s*(or|and)\s*'?\d*\s*[=<>])/i,

  // XSS
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|focus)\s*=/i,

  // Path Traversal
  /\.\.[\/\\]/,
  /%2e%2e/i,

  // Command Injection (excluding & which is valid in query strings)
  /[|;`$]/,

  // Common exploits
  /\{\{.*\}\}/,  // Template injection
  /\$\{.*\}/,    // Expression injection
];

// Blocked User Agents (known bots/scanners)
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /acunetix/i,
  /openvas/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /nuclei/i,
  /httpx/i,
];

// ============================================
// Rate Limiting (In-memory, use Redis in production)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

// Clean up periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now && (!value.blockedUntil || value.blockedUntil < now)) {
        rateLimitMap.delete(key);
      }
    }
    for (const [ip, count] of suspiciousActivity.entries()) {
      if (count < 3) suspiciousActivity.delete(ip);
    }
  }, 60 * 1000);
}

// ============================================
// Helper Functions
// ============================================

function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

function isRateLimited(
  ip: string,
  path: string
): { limited: boolean; remaining: number; resetAt: number } {
  const config = Object.entries(RATE_LIMIT_CONFIG).find(([key]) => path.startsWith(key));
  if (!config) return { limited: false, remaining: -1, resetAt: 0 };

  const [endpoint, limits] = config;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  // Check if blocked
  if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
    return { limited: true, remaining: 0, resetAt: entry.blockedUntil };
  }

  // Reset window if expired
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + limits.windowMs,
      blocked: false,
    });
    return { limited: false, remaining: limits.maxRequests - 1, resetAt: now + limits.windowMs };
  }

  // Check if over limit
  if (entry.count >= limits.maxRequests) {
    // Block if configured
    if ('blockMs' in limits && limits.blockMs) {
      entry.blocked = true;
      entry.blockedUntil = now + limits.blockMs;
    }
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { limited: false, remaining: limits.maxRequests - entry.count, resetAt: entry.resetAt };
}

function isMaliciousRequest(request: NextRequest): boolean {
  // Check pathname only (not the full URL with query params)
  const pathname = request.nextUrl.pathname;
  if (MALICIOUS_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }

  // Check query parameter values (not keys or the & separator)
  for (const [, value] of request.nextUrl.searchParams) {
    if (MALICIOUS_PATTERNS.some(pattern => pattern.test(value))) {
      return true;
    }
  }

  return false;
}

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BLOCKED_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

function recordSuspiciousActivity(ip: string): void {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);

  // Auto-block after 5 suspicious activities
  if (count >= 5) {
    blockedIPs.add(ip);
    suspiciousActivity.delete(ip);
    // Unblock after 1 hour
    setTimeout(() => blockedIPs.delete(ip), 60 * 60 * 1000);
  }
}

function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow same-origin requests
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed ||
    origin === `https://${allowed}` ||
    origin.endsWith('.vercel.app')
  );
}

// ============================================
// Security Headers
// ============================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy (CRITICAL for XSS prevention)
  response.headers.set('Content-Security-Policy', getCSPHeader());

  // Permissions Policy (control browser features)
  response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());

  // Strict Transport Security (force HTTPS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent XSS
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // Download options (IE)
  response.headers.set('X-Download-Options', 'noopen');

  // Permitted cross-domain policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Remove server header
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

// ============================================
// Main Middleware
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent');
  const origin = request.headers.get('origin');

  // 1. Check if IP is blocked (including auto-healing blocks)
  if (blockedIPs.has(clientIP) || autoHealingSystem.isIPBlocked(clientIP)) {
    recordSecurityIncident('rate_limit_exceeded', 'high', clientIP, {
      pathname,
      reason: 'IP blocked',
    });

    return new NextResponse('Access Denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 2. Check for blocked user agents (security scanners)
  if (isBlockedUserAgent(userAgent)) {
    recordSuspiciousActivity(clientIP);
    recordSecurityIncident('suspicious_ip', 'high', clientIP, {
      userAgent,
      pathname,
      reason: 'Blocked user agent (security scanner)',
    });

    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 3. Check for malicious patterns in request
  if (isMaliciousRequest(request)) {
    recordSuspiciousActivity(clientIP);

    // Detect type of attack
    const pathname = request.nextUrl.pathname;
    const queryString = request.nextUrl.search;
    const fullPath = pathname + queryString;

    let attackType: 'sql_injection' | 'xss_attempt' = 'sql_injection';
    if (/<script|javascript:|on\w+=/i.test(fullPath)) {
      attackType = 'xss_attempt';
    }

    recordSecurityIncident(attackType, 'critical', clientIP, {
      pathname,
      queryString,
      attackType,
    });

    return new NextResponse('Bad Request', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 4. Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const { limited, remaining, resetAt } = isRateLimited(clientIP, pathname);

    if (limited) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetAt),
          },
        }
      );
    }

    // 5. CORS validation for API routes
    if (!isValidOrigin(origin)) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // 6. Method validation for POST endpoints
    if (pathname === '/api/orders' && request.method !== 'POST') {
      return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    // 7. Content-Type validation for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { success: false, error: 'Invalid content type' },
          { status: 415 }
        );
      }
    }

    // Create response with security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetAt));

    // CORS headers for allowed origins
    if (origin && isValidOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
  }

  // 8. Block sensitive paths
  const blockedPaths = [
    '/.env',
    '/.git',
    '/wp-admin',
    '/wp-login',
    '/admin',
    '/phpmyadmin',
    '/.htaccess',
    '/config',
    '/backup',
    '/sql',
    '/database',
  ];

  if (blockedPaths.some(blocked => pathname.toLowerCase().startsWith(blocked))) {
    recordSuspiciousActivity(clientIP);
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (per IP)
// In production, use Redis or similar for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  '/api/orders': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 orders per minute
  '/api/distance': { maxRequests: 30, windowMs: 60 * 1000 }, // 30 distance checks per minute
  '/api/menu': { maxRequests: 60, windowMs: 60 * 1000 }, // 60 menu requests per minute
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

function isRateLimited(ip: string, path: string): boolean {
  // Find matching rate limit config
  const config = Object.entries(RATE_LIMIT).find(([key]) => path.startsWith(key));
  if (!config) return false;

  const [, { maxRequests, windowMs }] = config;
  const key = `${ip}:${config[0]}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);

    // Rate limiting
    if (isRateLimited(clientIP, pathname)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '10',
          },
        }
      );
    }

    // Add security headers to API responses
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

/**
 * Security utilities for AN Milk Tea
 * Comprehensive protection against common web attacks
 */

import { createHash, randomBytes } from 'crypto';

// ============================================
// CSRF Protection
// ============================================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFTokenData {
  token: string;
  createdAt: number;
}

// In production, use Redis or database
const csrfTokenStore = new Map<string, CSRFTokenData>();

export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  csrfTokenStore.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  if (!stored) return false;

  // Check expiry
  if (Date.now() - stored.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfTokenStore.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(stored.token, token);
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize string to prevent XSS attacks
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injection attempts
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize for safe display (decode HTML entities)
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  // Only allow digits, spaces, and common phone characters
  return phone.replace(/[^\d\s+()-]/g, '').slice(0, 20);
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  const sanitized = email.trim().toLowerCase().slice(0, 254);
  // Basic email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(sanitized) ? sanitized : '';
}

// ============================================
// SQL Injection Prevention
// ============================================

/**
 * Escape special characters for SQL (use parameterized queries instead when possible)
 */
export function escapeSQLString(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

// ============================================
// Rate Limiting (Enhanced)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number; // How long to block after exceeding limit
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if blocked
  if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    };
  }

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
      blocked: false,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check limit
  if (entry.count >= config.maxRequests) {
    // Block if configured
    if (config.blockDurationMs) {
      entry.blocked = true;
      entry.blockedUntil = now + config.blockDurationMs;
    }
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Clean up old entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now && (!value.blocked || (value.blockedUntil && value.blockedUntil < now))) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);
}

// ============================================
// IP Validation & Blocking
// ============================================

const blockedIPs = new Set<string>();
const suspiciousActivity = new Map<string, number>();

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function blockIP(ip: string, durationMs = 24 * 60 * 60 * 1000): void {
  blockedIPs.add(ip);
  setTimeout(() => blockedIPs.delete(ip), durationMs);
}

export function recordSuspiciousActivity(ip: string): void {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);

  // Auto-block after 10 suspicious activities
  if (count >= 10) {
    blockIP(ip);
    suspiciousActivity.delete(ip);
  }
}

// ============================================
// Request Validation
// ============================================

/**
 * Validate request origin
 */
export function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin.endsWith('.' + domain);
    }
    return origin === allowed || origin === `https://${allowed}` || origin === `http://${allowed}`;
  });
}

/**
 * Validate Content-Type header
 */
export function isValidContentType(contentType: string | null, expected: string[]): boolean {
  if (!contentType) return false;
  const type = contentType.split(';')[0].trim().toLowerCase();
  return expected.includes(type);
}

/**
 * Check for common attack patterns in request
 */
export function detectAttackPatterns(input: string): boolean {
  const attackPatterns = [
    // SQL Injection
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database)\b)/i,
    /('|")\s*(or|and)\s*('|"|\d)/i,
    /;\s*(drop|delete|update|insert)/i,

    // XSS
    /<script[^>]*>/i,
    /javascript:/i,
    /on(load|error|click|mouse|focus|blur)\s*=/i,

    // Path Traversal
    /\.\.[\/\\]/,
    /%2e%2e[\/\\]/i,

    // Command Injection
    /[;&|`$]/,
    /\$\{.*\}/,

    // LDAP Injection
    /[()\\*]/,
  ];

  return attackPatterns.some(pattern => pattern.test(input));
}

// ============================================
// Cryptographic Utilities
// ============================================

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data (for logging, comparison)
 */
export function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ============================================
// Honeypot Protection
// ============================================

/**
 * Check if honeypot field was filled (indicates bot)
 */
export function isHoneypotTriggered(honeypotValue: unknown): boolean {
  return honeypotValue !== undefined && honeypotValue !== '' && honeypotValue !== null;
}

// ============================================
// Request Fingerprinting
// ============================================

export interface RequestFingerprint {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
}

export function generateRequestFingerprint(fingerprint: RequestFingerprint): string {
  const data = `${fingerprint.ip}|${fingerprint.userAgent}|${fingerprint.acceptLanguage}|${fingerprint.acceptEncoding}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

// ============================================
// Sensitive Data Protection
// ============================================

/**
 * Mask sensitive data for logging
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return '***';
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '**';
  return `${maskedLocal}@${domain}`;
}

export function maskAddress(address: string): string {
  if (address.length < 10) return '***';
  return address.slice(0, 5) + '...' + address.slice(-5);
}

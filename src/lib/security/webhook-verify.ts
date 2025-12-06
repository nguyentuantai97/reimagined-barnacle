import crypto from 'crypto';

/**
 * Verify webhook signature from payment providers
 * Supports: SePay, Casso, VNPay
 */

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verify SePay webhook signature
 * SePay signs webhooks with HMAC-SHA256
 */
export function verifySePayWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid signature',
    };
  }
}

/**
 * Verify Casso webhook signature
 * Casso uses secure_token for verification
 */
export function verifyCassoWebhook(
  secureToken: string,
  expectedToken: string
): WebhookVerificationResult {
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(secureToken),
      Buffer.from(expectedToken)
    );

    return { valid };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid secure token',
    };
  }
}

/**
 * Verify VNPay webhook signature
 * VNPay uses vnp_SecureHash with SHA256
 */
export function verifyVNPayWebhook(
  params: Record<string, string>,
  receivedHash: string,
  secretKey: string
): WebhookVerificationResult {
  try {
    // Remove vnp_SecureHash from params
    const { vnp_SecureHash, ...dataParams } = params;

    // Sort params by key
    const sortedKeys = Object.keys(dataParams).sort();
    const signData = sortedKeys
      .map(key => `${key}=${dataParams[key]}`)
      .join('&');

    // Calculate hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(signData)
      .digest('hex');

    const valid = crypto.timingSafeEqual(
      Buffer.from(receivedHash.toLowerCase()),
      Buffer.from(expectedHash.toLowerCase())
    );

    return { valid };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid hash',
    };
  }
}

/**
 * Validate webhook IP address
 * Only accept webhooks from whitelisted IPs
 */
export function validateWebhookIP(
  clientIP: string,
  allowedIPs: string[]
): boolean {
  return allowedIPs.includes(clientIP);
}

/**
 * Known IP ranges for payment providers
 */
export const PAYMENT_PROVIDER_IPS = {
  // SePay IPs (example - cần update từ SePay)
  sepay: [
    '103.56.158.0/24',
    '118.69.176.0/24',
  ],

  // Casso IPs (example - cần update từ Casso)
  casso: [
    '103.200.20.0/24',
  ],

  // VNPay IPs (example - cần update từ VNPay)
  vnpay: [
    '113.20.97.0/24',
    '113.20.96.0/24',
  ],
};

/**
 * Check if IP is in CIDR range
 */
function ipInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);

  const ipNum = ip.split('.').reduce((num, oct) => (num << 8) + parseInt(oct), 0);
  const rangeNum = range.split('.').reduce((num, oct) => (num << 8) + parseInt(oct), 0);

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Validate IP against provider IP ranges
 */
export function validateProviderIP(
  clientIP: string,
  provider: keyof typeof PAYMENT_PROVIDER_IPS
): boolean {
  const allowedRanges = PAYMENT_PROVIDER_IPS[provider];
  return allowedRanges.some(range => ipInRange(clientIP, range));
}

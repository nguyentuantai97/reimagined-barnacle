/**
 * Advanced Input Sanitization
 * Làm sạch và validate mọi input từ user
 */

/**
 * Sanitize string input - loại bỏ các ký tự nguy hiểm
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    // Loại bỏ null bytes
    .replace(/\0/g, '')
    // Loại bỏ control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Normalize unicode
    .normalize('NFC')
    // Giới hạn độ dài
    .slice(0, 1000);
}

/**
 * Sanitize HTML - escape các ký tự đặc biệt
 */
export function escapeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate Vietnamese phone number
 */
export function validateVietnamesePhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Must start with 0 and have 10 digits
  // Or start with +84 and have 11 digits
  const vnPhoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

  return vnPhoneRegex.test(cleaned);
}

/**
 * Sanitize order data
 */
export function sanitizeOrderData(data: any): any {
  return {
    orderType: ['delivery', 'pickup'].includes(data.orderType) ? data.orderType : 'pickup',
    customer: {
      name: sanitizeString(data.customer?.name || ''),
      phone: sanitizeString(data.customer?.phone || ''),
      address: sanitizeString(data.customer?.address || ''),
      note: sanitizeString(data.customer?.note || '').slice(0, 500),
      latitude: typeof data.customer?.latitude === 'number' ? data.customer.latitude : null,
      longitude: typeof data.customer?.longitude === 'number' ? data.customer.longitude : null,
    },
    items: Array.isArray(data.items) ? data.items.map(sanitizeOrderItem) : [],
    subtotal: Math.max(0, Number(data.subtotal) || 0),
    deliveryFee: Math.max(0, Number(data.deliveryFee) || 0),
    total: Math.max(0, Number(data.total) || 0),
  };
}

/**
 * Sanitize order item
 */
function sanitizeOrderItem(item: any): any {
  return {
    productId: sanitizeString(item.productId || ''),
    cukcukId: sanitizeString(item.cukcukId || ''),
    cukcukCode: sanitizeString(item.cukcukCode || ''),
    name: sanitizeString(item.name || ''),
    quantity: Math.max(1, Math.min(100, parseInt(item.quantity) || 1)),
    price: Math.max(0, Number(item.price) || 0),
    amount: Math.max(0, Number(item.amount) || 0),
    note: sanitizeString(item.note || '').slice(0, 200),
    options: Array.isArray(item.options) ? item.options.map(sanitizeOption) : [],
  };
}

/**
 * Sanitize option
 */
function sanitizeOption(option: any): any {
  return {
    type: sanitizeString(option.type || ''),
    value: sanitizeString(option.value || ''),
    price: Math.max(0, Number(option.price) || 0),
  };
}

/**
 * Detect SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bselect\b.*\bfrom\b)/i,
    /(\binsert\b.*\binto\b)/i,
    /(\bdelete\b.*\bfrom\b)/i,
    /(\bdrop\b.*\btable\b)/i,
    /(\bexec\b|\bexecute\b)/i,
    /('\s*or\s*'?\d*\s*=\s*'?\d*)/i,
    /('\s*and\s*'?\d*\s*=\s*'?\d*)/i,
    /(;\s*drop\s+)/i,
    /(--\s*$)/,
    /\/\*.*\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(input: string, type: 'string' | 'email' | 'phone' = 'string'): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  // Check for SQL injection
  if (detectSQLInjection(input)) {
    return { valid: false, error: 'Invalid input detected' };
  }

  // Check for XSS
  if (detectXSS(input)) {
    return { valid: false, error: 'Invalid input detected' };
  }

  // Type-specific validation
  switch (type) {
    case 'email':
      if (!validateEmail(input)) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;

    case 'phone':
      if (!validateVietnamesePhone(input)) {
        return { valid: false, error: 'Invalid phone number' };
      }
      break;
  }

  return {
    valid: true,
    sanitized: sanitizeString(input),
  };
}

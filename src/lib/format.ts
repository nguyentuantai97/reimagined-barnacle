// Format price to Vietnamese currency
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

// Format price without currency symbol
export function formatPriceShort(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Format phone number
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Vietnamese phone format: 0xxx xxx xxx
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

// Validate Vietnamese phone number
export function isValidVietnamesePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Vietnamese phone: starts with 0, 10 digits total
  return /^0[3-9]\d{8}$/.test(cleaned);
}

// Generate order number
export function generateOrderNo(): string {
  const timestamp = Date.now();
  return `AN-${timestamp}`;
}

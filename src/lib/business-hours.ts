/**
 * Business hours configuration for AN Milk Tea
 */

export const BUSINESS_HOURS = {
  open: 10, // 10:00
  close: 20, // 20:00
  timezone: 'Asia/Ho_Chi_Minh',
};

export const SHOP_CONTACT = {
  phone: '0976257223',
  phoneDisplay: '0976 257 223',
  fanpage: 'https://www.facebook.com/profile.php?id=61573607969403',
};

/**
 * Check if the shop is currently open for orders
 * @returns true if within business hours (10:00 - 20:00 Vietnam time)
 */
export function isShopOpen(): boolean {
  const now = new Date();

  // Convert to Vietnam timezone
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: BUSINESS_HOURS.timezone }));
  const currentHour = vietnamTime.getHours();

  return currentHour >= BUSINESS_HOURS.open && currentHour < BUSINESS_HOURS.close;
}

/**
 * Get current Vietnam time info
 */
export function getVietnamTime(): { hour: number; minute: number; formatted: string } {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: BUSINESS_HOURS.timezone }));

  return {
    hour: vietnamTime.getHours(),
    minute: vietnamTime.getMinutes(),
    formatted: vietnamTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Get the closed message with contact info
 */
export function getClosedMessage(): string {
  return `Rất tiếc, hệ thống chỉ nhận đơn online từ ${BUSINESS_HOURS.open}:00 – ${BUSINESS_HOURS.close}:00. Nếu cần hỗ trợ ngay, quý khách vui lòng gọi ${SHOP_CONTACT.phoneDisplay} hoặc liên hệ fanpage. Xin cảm ơn và hẹn gặp lại quý khách!`;
}

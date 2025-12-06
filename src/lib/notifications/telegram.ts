/**
 * Telegram Bot Notification Service
 * Gửi thông báo đơn hàng mới đến Telegram
 *
 * Để sử dụng:
 * 1. Tạo bot qua @BotFather trên Telegram
 * 2. Lấy Bot Token
 * 3. Chat với bot và lấy Chat ID (hoặc tạo group và add bot vào)
 * 4. Set environment variables:
 *    - TELEGRAM_BOT_TOKEN
 *    - TELEGRAM_CHAT_ID
 */

import { CustomerInfo, OrderItem } from '@/types';
import { formatPrice } from '@/lib/format';

interface OrderNotificationData {
  orderNo: string;
  orderType: 'delivery' | 'pickup';
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  cukcukSynced?: boolean;
  cukcukError?: string;
}

/**
 * Check if Telegram notification is configured
 */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * Send order notification to Telegram
 */
export async function sendTelegramOrderNotification(
  data: OrderNotificationData
): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramConfigured()) {
    return { success: false, error: 'Telegram not configured' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;

  try {
    const isDelivery = data.orderType === 'delivery';
    const orderTypeText = isDelivery ? '🚚 GIAO HÀNG' : '🏪 ĐẾN LẤY';

    // Cảnh báo nếu đơn không sync được lên CUKCUK (VD: chưa mở ca)
    const syncWarning = data.cukcukSynced === false
      ? `\n⚠️ <b>CHƯA SYNC CUKCUK</b>\n<i>${data.cukcukError || 'Cần nhập đơn thủ công hoặc retry khi mở ca'}</i>\n`
      : '';

    // Build items list
    const itemsList = data.items
      .map((item, i) => {
        const optionsText = item.options
          .filter(opt => !opt.choiceName.toLowerCase().includes('không'))
          .map(opt => opt.choiceName)
          .join(', ');
        return `${i + 1}. ${item.name} x${item.quantity} - ${formatPrice(item.amount)}${optionsText ? `\n   ↳ ${optionsText}` : ''}`;
      })
      .join('\n');

    // Build Google Maps link
    let mapsText = '';
    if (isDelivery && data.customer.latitude && data.customer.longitude) {
      const mapsLink = `https://maps.google.com/?q=${data.customer.latitude},${data.customer.longitude}`;
      mapsText = `\n📍 <a href="${mapsLink}">Xem vị trí trên Maps</a>`;
    }

    // Build message
    const message = `
🧋 <b>ĐƠN HÀNG MỚI #${data.orderNo}</b>
${orderTypeText}${syncWarning}

👤 <b>Khách hàng:</b>
• Tên: ${data.customer.name}
• SĐT: ${data.customer.phone}
${isDelivery ? `• Địa chỉ: ${data.customer.address}${mapsText}` : '• Đến lấy tại quán'}
${data.customer.note ? `• Ghi chú: ${data.customer.note}` : ''}

🛒 <b>Đơn hàng:</b>
${itemsList}

💰 <b>Thanh toán:</b>
• Tạm tính: ${formatPrice(data.subtotal)}
${isDelivery ? `• Phí ship: ${formatPrice(data.deliveryFee)}` : ''}
• <b>TỔNG: ${formatPrice(data.total)}</b>

⏰ ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
    `.trim();

    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram send failed:', result);
      return { success: false, error: result.description || 'Unknown error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Telegram notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

import { NextResponse } from 'next/server';
import { createCukcukOrder, isCukcukConfigured } from '@/lib/cukcuk/client';
import { generateOrderNo, isValidVietnamesePhone } from '@/lib/format';
import { CustomerInfo, OrderItem } from '@/types';
import {
  sanitizeString,
  sanitizePhone,
  isHoneypotTriggered,
  detectAttackPatterns,
  maskPhone,
  maskAddress,
} from '@/lib/security';
import { sendTelegramOrderNotification, isTelegramConfigured } from '@/lib/notifications/telegram';
import { isShopOpen, getClosedMessage } from '@/lib/business-hours';
import { logOrderTransaction, TransactionStatus } from '@/lib/security/transaction-logger';
import { recordSecurityIncident } from '@/lib/security/auto-heal';
import { queueOrder } from '@/lib/db/order-queue';

type OrderType = 'delivery' | 'pickup';

interface CreateOrderRequest {
  orderType: OrderType;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  _hp?: string; // Honeypot field
}

// Validate number is positive and reasonable
function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && amount >= 0 && amount <= 100000000; // Max 100M VND
}

function getClientIP(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  const cfIP = headers.get('cf-connecting-ip');

  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

export async function POST(request: Request) {
  const clientIP = getClientIP(request);

  try {
    const body: CreateOrderRequest = await request.json();

    // Check business hours - reject orders outside 10:00-20:00
    if (!isShopOpen()) {
      return NextResponse.json(
        { success: false, error: getClosedMessage(), errorCode: 'SHOP_CLOSED' },
        { status: 400 }
      );
    }

    // Honeypot check - bots often fill hidden fields
    if (isHoneypotTriggered(body._hp)) {
      recordSecurityIncident('suspicious_ip', 'medium', clientIP, {
        reason: 'Honeypot triggered',
        endpoint: '/api/orders',
      });

      // Silently reject bot submissions
      return NextResponse.json({
        success: true,
        data: { orderNo: 'BOT-REJECTED', message: 'Đơn hàng đã được tạo' },
      });
    }

    // Attack pattern detection on all string inputs
    const inputsToCheck = [
      body.customer?.name,
      body.customer?.phone,
      body.customer?.address,
      body.customer?.note,
    ].filter(Boolean).join(' ');

    if (detectAttackPatterns(inputsToCheck)) {
      recordSecurityIncident('sql_injection', 'critical', clientIP, {
        endpoint: '/api/orders',
        inputs: inputsToCheck.substring(0, 200), // Limit logged data
      });

      console.warn('Attack pattern detected in order submission');
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate order type
    const orderType = body.orderType === 'pickup' ? 'pickup' : 'delivery';
    const isDelivery = orderType === 'delivery';

    // Sanitize customer data with enhanced security
    const customer: CustomerInfo = {
      name: sanitizeString(body.customer?.name || '', 100),
      phone: sanitizePhone(body.customer?.phone || ''),
      address: sanitizeString(body.customer?.address || '', 500),
      note: sanitizeString(body.customer?.note || '', 500),
      latitude: typeof body.customer?.latitude === 'number' ? body.customer.latitude : undefined,
      longitude: typeof body.customer?.longitude === 'number' ? body.customer.longitude : undefined,
    };

    // Validate required fields
    if (!customer.name || customer.name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ tên (ít nhất 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!customer.phone || !isValidVietnamesePhone(customer.phone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate address: cần có địa chỉ text HOẶC có tọa độ GPS
    // - Nếu có GPS (latitude + longitude) → địa chỉ text có thể ngắn
    // - Nếu không có GPS → địa chỉ text phải đầy đủ (>=10 ký tự)
    const hasGPS = customer.latitude && customer.longitude;
    const hasValidAddress = customer.address && customer.address.length >= 10;

    if (isDelivery && !hasGPS && !hasValidAddress) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập địa chỉ hoặc bấm định vị GPS' },
        { status: 400 }
      );
    }

    // Nếu giao hàng nhưng không có địa chỉ gì cả
    if (isDelivery && !customer.address && !hasGPS) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập địa chỉ giao hàng' },
        { status: 400 }
      );
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Giỏ hàng trống' },
        { status: 400 }
      );
    }

    if (body.items.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Đơn hàng không được quá 50 sản phẩm' },
        { status: 400 }
      );
    }

    // Validate amounts
    if (!isValidAmount(body.subtotal) || !isValidAmount(body.deliveryFee) || !isValidAmount(body.total)) {
      return NextResponse.json(
        { success: false, error: 'Số tiền không hợp lệ' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNo = generateOrderNo();

    // If CUKCUK is configured, create order in CUKCUK
    // This will trigger automatic bill and label printing
    let cukcukSynced = false;
    let cukcukError = '';

    if (isCukcukConfigured()) {
      console.log('[CUKCUK] Starting order sync for:', orderNo);

      const cukcukResult = await createCukcukOrder(
        orderNo,
        customer, // Use sanitized customer data
        body.items,
        body.subtotal,
        body.deliveryFee,
        body.total,
        orderType
      );

      if (cukcukResult.success) {
        cukcukSynced = true;
        console.log('[CUKCUK] Order synced successfully:', cukcukResult.orderCode);
      } else {
        cukcukError = cukcukResult.error || 'Unknown error';
        console.error('[CUKCUK] Order sync failed:', cukcukError);

        // Queue order để retry sau khi mở ca
        // (VD: cửa hàng chưa mở ca nhưng khách đặt trong giờ bán)
        try {
          const queueResult = await queueOrder({
            orderNo,
            orderType,
            customer,
            items: body.items,
            subtotal: body.subtotal,
            deliveryFee: body.deliveryFee,
            total: body.total,
            error: cukcukError,
          });

          if (queueResult.success) {
            console.log(`[CUKCUK] Order ${orderNo} queued for retry later`);
          } else {
            console.error('[CUKCUK] Failed to queue order:', queueResult.error);
          }
        } catch (queueError) {
          console.error('[CUKCUK] Queue error:', queueError);
        }
      }
    } else {
      // CUKCUK not configured - log warning
      console.warn('[CUKCUK] Not configured - order will not sync to POS');
      console.warn('[CUKCUK] CUKCUK_DOMAIN:', process.env.CUKCUK_DOMAIN ? 'SET' : 'NOT SET');
      console.warn('[CUKCUK] CUKCUK_SECRET_KEY:', process.env.CUKCUK_SECRET_KEY ? 'SET' : 'NOT SET');
    }

    // Log order transaction for audit trail
    logOrderTransaction({
      orderId: orderNo,
      amount: body.total,
      status: cukcukSynced ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
      clientIP,
      error: cukcukError || undefined,
      metadata: {
        orderType,
        customerPhone: customer.phone,
        itemsCount: body.items.length,
      },
    });

    // Send Telegram notification (non-blocking)
    // Bao gồm cảnh báo nếu đơn không sync được lên CUKCUK (VD: chưa mở ca)
    if (isTelegramConfigured()) {
      sendTelegramOrderNotification({
        orderNo,
        orderType,
        customer,
        items: body.items,
        subtotal: body.subtotal,
        deliveryFee: body.deliveryFee,
        total: body.total,
        cukcukSynced,
        cukcukError: cukcukError || undefined,
      }).then((result) => {
        if (!result.success) {
          console.error('Telegram notification failed:', result.error);
        }
      }).catch((err) => {
        console.error('Telegram notification error:', err);
      });
    }

    // Log order with masked sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log('Order created:', {
        orderNo,
        orderType,
        customer: customer.name,
        phone: maskPhone(customer.phone),
        address: customer.address ? maskAddress(customer.address) : 'N/A',
        items: body.items.length,
        total: body.total,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo,
        message: 'Đơn hàng đã được tạo thành công',
        cukcukSynced,
        cukcukError: cukcukError || undefined,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi tạo đơn hàng' },
      { status: 500 }
    );
  }
}

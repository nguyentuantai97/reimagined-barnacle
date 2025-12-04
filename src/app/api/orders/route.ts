import { NextResponse } from 'next/server';
import { createCukcukOrder, isCukcukConfigured } from '@/lib/cukcuk/client';
import { generateOrderNo, isValidVietnamesePhone } from '@/lib/format';
import { CustomerInfo, OrderItem } from '@/types';

type OrderType = 'delivery' | 'pickup';

interface CreateOrderRequest {
  orderType: OrderType;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// Sanitize string input to prevent XSS
function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

// Validate number is positive and reasonable
function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && amount >= 0 && amount <= 100000000; // Max 100M VND
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate order type
    const orderType = body.orderType === 'pickup' ? 'pickup' : 'delivery';
    const isDelivery = orderType === 'delivery';

    // Sanitize customer data
    const customer: CustomerInfo = {
      name: sanitizeString(body.customer?.name || '', 100),
      phone: sanitizeString(body.customer?.phone || '', 15),
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

    if (isDelivery && (!customer.address || customer.address.length < 10)) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập địa chỉ giao hàng đầy đủ' },
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
    if (isCukcukConfigured()) {
      const cukcukResult = await createCukcukOrder(
        orderNo,
        customer, // Use sanitized customer data
        body.items,
        body.subtotal,
        body.deliveryFee,
        body.total,
        orderType
      );

      if (!cukcukResult.success) {
        console.error('CUKCUK order creation failed:', cukcukResult.error);
        // Don't fail the order if CUKCUK fails - log and continue
        // The store can manually process these orders
      }
    } else {
      // CUKCUK not configured - log warning
      console.warn('CUKCUK not configured - order will not sync to POS');
    }

    // TODO: Save order to local database for backup
    // This would be implemented with Drizzle ORM

    // Log order only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Order created:', {
        orderNo,
        orderType,
        customer: customer.name,
        items: body.items.length,
        total: body.total,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo,
        message: 'Đơn hàng đã được tạo thành công',
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

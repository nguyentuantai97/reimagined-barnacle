import { NextResponse } from 'next/server';
import { createCukcukOrder, isCukcukConfigured } from '@/lib/cukcuk/client';
import { generateOrderNo } from '@/lib/format';
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

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate order type
    const orderType = body.orderType || 'delivery';
    const isDelivery = orderType === 'delivery';

    // Validate required fields (address only required for delivery)
    if (!body.customer?.name || !body.customer?.phone) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin khách hàng' },
        { status: 400 }
      );
    }

    if (isDelivery && !body.customer?.address) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập địa chỉ giao hàng' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Giỏ hàng trống' },
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
        body.customer,
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
        customer: body.customer.name,
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

import { NextResponse } from 'next/server';
import { getCukcukOrderByCode, getCukcukOrdersByPhone } from '@/lib/cukcuk/client';
import { isValidVietnamesePhone } from '@/lib/format';
import { sanitizeString, sanitizePhone } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mã đơn hàng hoặc số điện thoại' },
        { status: 400 }
      );
    }

    const sanitizedQuery = sanitizeString(query.trim(), 50);

    // Check if query is a phone number
    const isPhone = isValidVietnamesePhone(sanitizedQuery);

    if (isPhone) {
      // Search by phone number
      const phone = sanitizePhone(sanitizedQuery);
      const result = await getCukcukOrdersByPhone(phone);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Không tìm thấy đơn hàng' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          searchType: 'phone',
          orders: result.orders || [],
        },
      });
    } else {
      // Search by order code (AN-xxxx format)
      const result = await getCukcukOrderByCode(sanitizedQuery);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Không tìm thấy đơn hàng' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          searchType: 'code',
          order: result.order,
        },
      });
    }
  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi tra cứu đơn hàng' },
      { status: 500 }
    );
  }
}

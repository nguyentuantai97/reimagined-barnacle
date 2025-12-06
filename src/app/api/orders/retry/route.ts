import { NextResponse } from 'next/server';
import {
  retryAllPendingOrders,
  countPendingOrders,
  cleanupOldOrders,
} from '@/lib/db/order-queue';

/**
 * GET /api/orders/retry
 * Xem số lượng đơn hàng đang pending
 */
export async function GET() {
  try {
    const count = countPendingOrders();
    return NextResponse.json({
      success: true,
      data: {
        pendingCount: count,
        message: count > 0
          ? `Có ${count} đơn hàng đang chờ đồng bộ`
          : 'Không có đơn hàng nào đang chờ',
      },
    });
  } catch (error) {
    console.error('[OrderRetry] Error counting pending orders:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/retry
 * Retry tất cả đơn hàng pending lên CUKCUK
 * Dùng khi mở ca để đồng bộ các đơn đã đặt trước đó
 *
 * Body (optional):
 * - cleanup: boolean - Xóa các đơn đã sync hoặc quá 7 ngày
 */
export async function POST(request: Request) {
  try {
    // Validate API key để bảo vệ endpoint
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY || 'tea-shop-internal-key';

    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body để check cleanup flag
    let doCleanup = false;
    try {
      const body = await request.json();
      doCleanup = body.cleanup === true;
    } catch {
      // Body is optional, ignore parse errors
    }

    // Retry all pending orders
    console.log('[OrderRetry] Starting retry of pending orders...');
    const result = await retryAllPendingOrders();

    // Cleanup old orders if requested
    let cleanedUp = 0;
    if (doCleanup) {
      cleanedUp = cleanupOldOrders();
    }

    return NextResponse.json({
      success: true,
      data: {
        total: result.total,
        synced: result.synced,
        failed: result.failed,
        cleanedUp: doCleanup ? cleanedUp : undefined,
        results: result.results,
        message: result.total === 0
          ? 'Không có đơn hàng nào cần đồng bộ'
          : `Đã đồng bộ ${result.synced}/${result.total} đơn hàng`,
      },
    });
  } catch (error) {
    console.error('[OrderRetry] Error retrying orders:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi retry đơn hàng' },
      { status: 500 }
    );
  }
}

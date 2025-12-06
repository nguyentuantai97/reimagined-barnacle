import { createCukcukOrder } from '../cukcuk/client';
import { CustomerInfo, OrderItem } from '@/types';

/**
 * In-memory queue cho pending orders
 * Note: Trên Vercel serverless, queue sẽ bị reset khi instance restart
 * Đây là giải pháp tạm thời - đơn pending vẫn được gửi qua Telegram
 */
interface PendingOrderData {
  id: number;
  orderNo: string;
  orderType: 'delivery' | 'pickup';
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
}

// In-memory store (will be reset on serverless cold start)
const pendingOrdersMap = new Map<number, PendingOrderData>();
let nextId = 1;

const MAX_RETRY_COUNT = 5;

/**
 * Lưu đơn hàng vào queue khi CUKCUK chưa sẵn sàng
 * Note: Trên Vercel, đơn vẫn được gửi qua Telegram để theo dõi
 */
export async function queueOrder(params: {
  orderNo: string;
  orderType: 'delivery' | 'pickup';
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  error?: string;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const id = nextId++;
    const order: PendingOrderData = {
      id,
      orderNo: params.orderNo,
      orderType: params.orderType,
      customer: params.customer,
      items: params.items,
      subtotal: params.subtotal,
      deliveryFee: params.deliveryFee,
      total: params.total,
      status: 'pending',
      retryCount: 0,
      lastError: params.error,
      createdAt: new Date(),
    };

    pendingOrdersMap.set(id, order);
    console.log(`[OrderQueue] Order ${params.orderNo} queued with id: ${id}`);
    return { success: true, id };
  } catch (error) {
    console.error('[OrderQueue] Failed to queue order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Lấy tất cả đơn hàng pending chưa đạt max retry
 */
export function getPendingOrders(): PendingOrderData[] {
  const orders: PendingOrderData[] = [];
  pendingOrdersMap.forEach((order) => {
    if (order.status === 'pending' && order.retryCount < MAX_RETRY_COUNT) {
      orders.push(order);
    }
  });
  return orders;
}

/**
 * Đếm số đơn pending
 */
export function countPendingOrders(): number {
  let count = 0;
  pendingOrdersMap.forEach((order) => {
    if (order.status === 'pending') {
      count++;
    }
  });
  return count;
}

/**
 * Retry đồng bộ một đơn hàng lên CUKCUK
 */
export async function retryOrder(orderId: number): Promise<{
  success: boolean;
  orderNo?: string;
  error?: string;
}> {
  const order = pendingOrdersMap.get(orderId);

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'pending') {
    return { success: false, error: `Order is not pending (status: ${order.status})` };
  }

  // Thử gửi lên CUKCUK
  const result = await createCukcukOrder(
    order.orderNo,
    order.customer,
    order.items,
    order.subtotal,
    order.deliveryFee,
    order.total,
    order.orderType
  );

  if (result.success) {
    order.status = 'synced';
    console.log(`[OrderQueue] Order ${order.orderNo} synced successfully`);
    return { success: true, orderNo: order.orderNo };
  } else {
    order.retryCount++;
    order.lastError = result.error || 'Unknown error';

    if (order.retryCount >= MAX_RETRY_COUNT) {
      order.status = 'failed';
    }

    console.log(`[OrderQueue] Order ${order.orderNo} retry failed (attempt ${order.retryCount}): ${result.error}`);
    return { success: false, orderNo: order.orderNo, error: result.error };
  }
}

/**
 * Retry tất cả đơn hàng pending
 * Dùng khi mở ca để đồng bộ các đơn đã đặt trước đó
 */
export async function retryAllPendingOrders(): Promise<{
  total: number;
  synced: number;
  failed: number;
  results: Array<{ orderNo: string; success: boolean; error?: string }>;
}> {
  const orders = getPendingOrders();
  const results: Array<{ orderNo: string; success: boolean; error?: string }> = [];

  let synced = 0;
  let failed = 0;

  for (const order of orders) {
    const result = await retryOrder(order.id);
    results.push({
      orderNo: order.orderNo,
      success: result.success,
      error: result.error,
    });

    if (result.success) {
      synced++;
    } else {
      failed++;
    }

    // Delay 500ms giữa các request để tránh rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[OrderQueue] Retry all completed: ${synced} synced, ${failed} failed out of ${orders.length}`);

  return {
    total: orders.length,
    synced,
    failed,
    results,
  };
}

/**
 * Xóa các đơn hàng đã sync
 */
export function cleanupOldOrders(): number {
  let cleaned = 0;
  pendingOrdersMap.forEach((order, id) => {
    if (order.status === 'synced') {
      pendingOrdersMap.delete(id);
      cleaned++;
    }
  });
  console.log(`[OrderQueue] Cleaned up ${cleaned} old orders`);
  return cleaned;
}

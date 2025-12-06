import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Pending Orders Table
 * Lưu các đơn hàng chưa được đồng bộ thành công lên CUKCUK
 * (VD: khi cửa hàng chưa mở ca)
 */
export const pendingOrders = sqliteTable('pending_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Order info
  orderNo: text('order_no').notNull().unique(),
  orderType: text('order_type').notNull(), // 'delivery' | 'pickup'

  // Customer info (JSON)
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address'),
  customerNote: text('customer_note'),
  customerLatitude: real('customer_latitude'),
  customerLongitude: real('customer_longitude'),

  // Order data (JSON string)
  items: text('items').notNull(), // JSON stringify of OrderItem[]

  // Amounts
  subtotal: real('subtotal').notNull(),
  deliveryFee: real('delivery_fee').notNull(),
  total: real('total').notNull(),

  // Status tracking
  status: text('status').notNull().default('pending'), // 'pending' | 'synced' | 'failed' | 'cancelled'
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

// Types
export type PendingOrder = typeof pendingOrders.$inferSelect;
export type NewPendingOrder = typeof pendingOrders.$inferInsert;

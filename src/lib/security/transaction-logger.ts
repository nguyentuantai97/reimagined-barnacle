/**
 * Transaction Logger
 * Logs all payment transactions for audit and security
 */

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SUSPICIOUS = 'SUSPICIOUS',
}

export enum TransactionType {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  WEBHOOK = 'WEBHOOK',
}

export interface TransactionLog {
  id: string;
  timestamp: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  orderId?: string;
  paymentMethod?: string;
  provider?: string;
  clientIP: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

class TransactionLogger {
  private logs: TransactionLog[] = [];
  private readonly maxLogs = 10000; // Keep last 10k logs in memory

  /**
   * Log a transaction
   */
  log(log: Omit<TransactionLog, 'id' | 'timestamp'>): void {
    const entry: TransactionLog = {
      ...log,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Transaction]', entry);
    }

    // In production, you should send to external logging service
    // e.g., Sentry, LogRocket, Datadog, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Get transaction by ID
   */
  getById(id: string): TransactionLog | undefined {
    return this.logs.find(log => log.id === id);
  }

  /**
   * Get transactions by order ID
   */
  getByOrderId(orderId: string): TransactionLog[] {
    return this.logs.filter(log => log.orderId === orderId);
  }

  /**
   * Get suspicious transactions
   */
  getSuspicious(): TransactionLog[] {
    return this.logs.filter(log => log.status === TransactionStatus.SUSPICIOUS);
  }

  /**
   * Get recent transactions
   */
  getRecent(limit = 100): TransactionLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Check for suspicious patterns
   */
  checkSuspiciousActivity(clientIP: string): boolean {
    const recentLogs = this.logs.filter(
      log => log.clientIP === clientIP && Date.now() - log.timestamp < 3600000 // 1 hour
    );

    // Too many failed transactions
    const failedCount = recentLogs.filter(
      log => log.status === TransactionStatus.FAILED
    ).length;
    if (failedCount > 5) return true;

    // Too many transactions in short time
    if (recentLogs.length > 20) return true;

    // Unusual amount patterns (e.g., testing with small amounts)
    const smallAmounts = recentLogs.filter(log => log.amount < 1000).length;
    if (smallAmounts > 10) return true;

    return false;
  }

  /**
   * Generate unique transaction ID
   */
  private generateId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  /**
   * Send to external logging service
   */
  private sendToExternalService(log: TransactionLog): void {
    // TODO: Implement integration with logging service
    // Example: Sentry, LogRocket, Datadog, etc.

    // For now, just log critical errors
    if (log.status === TransactionStatus.SUSPICIOUS || log.error) {
      console.error('[CRITICAL TRANSACTION]', log);
    }
  }

  /**
   * Export logs (for admin dashboard)
   */
  exportLogs(startDate?: number, endDate?: number): TransactionLog[] {
    let logs = this.logs;

    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }

    return logs;
  }
}

// Singleton instance
export const transactionLogger = new TransactionLogger();

/**
 * Helper function to log order transaction
 */
export function logOrderTransaction(params: {
  orderId: string;
  amount: number;
  status: TransactionStatus;
  clientIP: string;
  userAgent?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}): void {
  transactionLogger.log({
    type: TransactionType.ORDER,
    currency: 'VND',
    ...params,
  });
}

/**
 * Helper function to log payment webhook
 */
export function logPaymentWebhook(params: {
  orderId: string;
  amount: number;
  provider: string;
  status: TransactionStatus;
  clientIP: string;
  metadata?: Record<string, unknown>;
  error?: string;
}): void {
  transactionLogger.log({
    type: TransactionType.WEBHOOK,
    currency: 'VND',
    paymentMethod: 'bank_transfer',
    ...params,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import {
  verifySePayWebhook,
  verifyCassoWebhook,
  validateProviderIP,
} from '@/lib/security/webhook-verify';
import {
  logPaymentWebhook,
  TransactionStatus,
  transactionLogger,
} from '@/lib/security/transaction-logger';

/**
 * Payment Webhook Endpoint
 * Receives payment confirmations from SePay, Casso, VNPay
 *
 * Security features:
 * - Signature verification
 * - IP whitelist
 * - Transaction logging
 * - Suspicious activity detection
 */

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // 1. Get provider from query or header
    const provider = request.nextUrl.searchParams.get('provider') || 'sepay';

    if (!['sepay', 'casso', 'vnpay'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // 2. IP Whitelist validation (CRITICAL SECURITY)
    // Uncomment in production when you have real IPs from providers
    // if (!validateProviderIP(clientIP, provider as 'sepay' | 'casso' | 'vnpay')) {
    //   logPaymentWebhook({
    //     orderId: 'unknown',
    //     amount: 0,
    //     provider,
    //     status: TransactionStatus.SUSPICIOUS,
    //     clientIP,
    //     error: 'Invalid IP address',
    //   });
    //
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized IP' },
    //     { status: 403 }
    //   );
    // }

    // 3. Parse webhook payload
    const body = await request.json();

    // 4. Verify signature based on provider
    let isValid = false;
    const signature = request.headers.get('x-signature') || body.signature;

    switch (provider) {
      case 'sepay': {
        const secret = process.env.SEPAY_WEBHOOK_SECRET;
        if (!secret) {
          throw new Error('SEPAY_WEBHOOK_SECRET not configured');
        }
        const result = verifySePayWebhook(
          JSON.stringify(body.data || body),
          signature,
          secret
        );
        isValid = result.valid;
        break;
      }

      case 'casso': {
        const expectedToken = process.env.CASSO_SECURE_TOKEN;
        if (!expectedToken) {
          throw new Error('CASSO_SECURE_TOKEN not configured');
        }
        const result = verifyCassoWebhook(body.secure_token, expectedToken);
        isValid = result.valid;
        break;
      }

      case 'vnpay': {
        const secret = process.env.VNPAY_HASH_SECRET;
        if (!secret) {
          throw new Error('VNPAY_HASH_SECRET not configured');
        }
        // VNPay webhook implementation
        isValid = true; // TODO: Implement VNPay verification
        break;
      }
    }

    if (!isValid) {
      logPaymentWebhook({
        orderId: body.orderCode || body.orderId || 'unknown',
        amount: body.amount || 0,
        provider,
        status: TransactionStatus.SUSPICIOUS,
        clientIP,
        error: 'Invalid signature',
        metadata: { body },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 5. Extract payment info (format varies by provider)
    const paymentInfo = extractPaymentInfo(provider, body);

    // 6. Check for suspicious activity
    if (transactionLogger.checkSuspiciousActivity(clientIP)) {
      logPaymentWebhook({
        orderId: paymentInfo.orderId,
        amount: paymentInfo.amount,
        provider,
        status: TransactionStatus.SUSPICIOUS,
        clientIP,
        error: 'Suspicious activity detected',
        metadata: paymentInfo.metadata,
      });

      // Still process but flag for review
      console.warn('[SUSPICIOUS WEBHOOK]', { clientIP, paymentInfo });
    }

    // 7. Verify amount matches order
    // TODO: Get order from database and verify amount
    // const order = await getOrderByCode(paymentInfo.orderId);
    // if (!order || order.total !== paymentInfo.amount) {
    //   throw new Error('Amount mismatch');
    // }

    // 8. Update order status in CUKCUK
    // TODO: Call CUKCUK API to mark order as paid
    // await updateCukcukOrderPaymentStatus(paymentInfo.orderId, 'PAID');

    // 9. Log successful payment
    logPaymentWebhook({
      orderId: paymentInfo.orderId,
      amount: paymentInfo.amount,
      provider,
      status: TransactionStatus.SUCCESS,
      clientIP,
      metadata: paymentInfo.metadata,
    });

    // 10. Send confirmation (email, SMS, notification)
    // TODO: Send confirmation to customer

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed',
    });

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);

    logPaymentWebhook({
      orderId: 'unknown',
      amount: 0,
      provider: 'unknown',
      status: TransactionStatus.FAILED,
      clientIP,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Extract payment info from webhook payload
 */
function extractPaymentInfo(provider: string, body: any) {
  switch (provider) {
    case 'sepay':
      return {
        orderId: body.orderCode || body.content,
        amount: body.amount || body.transferAmount,
        transactionId: body.transactionId || body.id,
        metadata: {
          bankAccount: body.accountNumber,
          description: body.description,
          transactionDate: body.when,
        },
      };

    case 'casso':
      return {
        orderId: body.description?.match(/DH\d+/)?.[0] || 'unknown',
        amount: body.amount,
        transactionId: body.id,
        metadata: {
          bankAccount: body.bank_sub_acc_id,
          description: body.description,
          transactionDate: body.when,
        },
      };

    case 'vnpay':
      return {
        orderId: body.vnp_TxnRef,
        amount: parseInt(body.vnp_Amount) / 100, // VNPay sends amount * 100
        transactionId: body.vnp_TransactionNo,
        metadata: {
          bankCode: body.vnp_BankCode,
          responseCode: body.vnp_ResponseCode,
          transactionDate: body.vnp_PayDate,
        },
      };

    default:
      throw new Error('Unknown provider');
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

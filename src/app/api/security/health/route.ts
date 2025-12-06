import { NextResponse } from 'next/server';
import { autoHealingSystem } from '@/lib/security/auto-heal';
import { transactionLogger } from '@/lib/security/transaction-logger';

/**
 * Security Health Check Endpoint
 * Endpoint này để monitor 24/7 bảo mật
 * Có thể gọi từ uptime monitoring services (UptimeRobot, Better Uptime, etc.)
 */

export async function GET() {
  try {
    // Get security health status
    const healthCheck = autoHealingSystem.healthCheck();

    // Get detailed stats for last 24 hours
    const stats24h = autoHealingSystem.getStats(24);

    // Get blocked IPs
    const blockedIPs = autoHealingSystem.getBlockedIPs();

    // Get suspicious transactions
    const suspiciousTransactions = transactionLogger.getSuspicious();

    // Overall health status
    const overallStatus = healthCheck.status;

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      security: {
        health: healthCheck,
        last24Hours: stats24h,
        blockedIPs: {
          count: blockedIPs.length,
          ips: blockedIPs.slice(0, 5), // Only show first 5
        },
        suspiciousTransactions: {
          count: suspiciousTransactions.length,
          recent: suspiciousTransactions.slice(-5), // Last 5
        },
      },
      recommendations: getSecurityRecommendations(healthCheck, stats24h),
    });
  } catch (error) {
    console.error('[HEALTH CHECK ERROR]', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Get security recommendations based on stats
 */
function getSecurityRecommendations(
  healthCheck: ReturnType<typeof autoHealingSystem.healthCheck>,
  stats24h: ReturnType<typeof autoHealingSystem.getStats>
): string[] {
  const recommendations: string[] = [];

  // Check for high attack volume
  if (stats24h.totalIncidents > 100) {
    recommendations.push('⚠️ High attack volume detected. Consider enabling additional WAF rules.');
  }

  // Check for SQL injection attempts
  if ((stats24h.incidentsByType.sql_injection || 0) > 0) {
    recommendations.push('🔒 SQL injection attempts detected. Review database access patterns.');
  }

  // Check for XSS attempts
  if ((stats24h.incidentsByType.xss_attempt || 0) > 0) {
    recommendations.push('🔒 XSS attempts detected. Verify CSP headers are strict enough.');
  }

  // Check for brute force
  if ((stats24h.incidentsByType.brute_force || 0) > 10) {
    recommendations.push('🔐 Multiple brute force attempts. Consider implementing CAPTCHA.');
  }

  // Check auto-heal rate
  const autoHealRate = stats24h.autoHealedCount / (stats24h.totalIncidents || 1);
  if (autoHealRate < 0.8 && stats24h.totalIncidents > 10) {
    recommendations.push('⚙️ Low auto-heal rate. Manual intervention may be required.');
  }

  // Check for persistent attackers
  const topAttacker = stats24h.topAttackers[0];
  if (topAttacker && topAttacker.count > 20) {
    recommendations.push(`🚫 Persistent attacker detected: ${topAttacker.ip} (${topAttacker.count} attempts)`);
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All security systems operating normally.');
  }

  return recommendations;
}

// Dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

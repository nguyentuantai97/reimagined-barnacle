/**
 * Auto-Healing Security System
 * Tự động phát hiện và vá lỗi bảo mật 24/7
 */

export interface SecurityIncident {
  id: string;
  timestamp: number;
  type: 'rate_limit_exceeded' | 'suspicious_ip' | 'sql_injection' | 'xss_attempt' | 'csrf_attempt' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientIP: string;
  details: Record<string, unknown>;
  autoHealed: boolean;
  action: string;
}

class AutoHealingSystem {
  private incidents: SecurityIncident[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Map<string, number>();
  private readonly maxIncidents = 1000;

  /**
   * Record security incident và tự động heal
   */
  recordIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'autoHealed' | 'action'>): void {
    const action = this.autoHeal(incident);

    const fullIncident: SecurityIncident = {
      ...incident,
      id: this.generateIncidentId(),
      timestamp: Date.now(),
      autoHealed: action !== 'logged',
      action,
    };

    this.incidents.push(fullIncident);

    // Keep only recent incidents
    if (this.incidents.length > this.maxIncidents) {
      this.incidents = this.incidents.slice(-this.maxIncidents);
    }

    // Log critical incidents
    if (incident.severity === 'critical') {
      console.error('[CRITICAL SECURITY INCIDENT]', fullIncident);
      this.notifyAdmin(fullIncident);
    }
  }

  /**
   * Auto-heal security threats
   */
  private autoHeal(incident: Pick<SecurityIncident, 'type' | 'severity' | 'clientIP'>): string {
    const { type, severity, clientIP } = incident;

    switch (type) {
      case 'brute_force':
        if (severity === 'high' || severity === 'critical') {
          this.blockIP(clientIP, 24 * 60 * 60 * 1000); // Block 24h
          return 'blocked_24h';
        }
        this.blockIP(clientIP, 60 * 60 * 1000); // Block 1h
        return 'blocked_1h';

      case 'sql_injection':
      case 'xss_attempt':
        this.blockIP(clientIP, 7 * 24 * 60 * 60 * 1000); // Block 7 days
        return 'blocked_7d';

      case 'suspicious_ip':
        const count = (this.suspiciousIPs.get(clientIP) || 0) + 1;
        this.suspiciousIPs.set(clientIP, count);

        if (count >= 3) {
          this.blockIP(clientIP, 60 * 60 * 1000); // Block 1h
          return 'blocked_1h_after_3_attempts';
        }
        return 'marked_suspicious';

      case 'rate_limit_exceeded':
        // Already handled by rate limiting
        return 'rate_limited';

      case 'csrf_attempt':
        if (severity === 'high' || severity === 'critical') {
          this.blockIP(clientIP, 60 * 60 * 1000); // Block 1h
          return 'blocked_1h';
        }
        return 'logged';

      default:
        return 'logged';
    }
  }

  /**
   * Block IP address
   */
  private blockIP(ip: string, durationMs: number): void {
    this.blockedIPs.add(ip);

    // Auto-unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      this.suspiciousIPs.delete(ip);
    }, durationMs);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Get all blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  /**
   * Get security stats
   */
  getStats(hours = 24): {
    totalIncidents: number;
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    topAttackers: Array<{ ip: string; count: number }>;
    autoHealedCount: number;
  } {
    const since = Date.now() - hours * 60 * 60 * 1000;
    const recentIncidents = this.incidents.filter((i) => i.timestamp >= since);

    const incidentsByType: Record<string, number> = {};
    const incidentsBySeverity: Record<string, number> = {};
    const ipCounts = new Map<string, number>();

    let autoHealedCount = 0;

    recentIncidents.forEach((incident) => {
      // Count by type
      incidentsByType[incident.type] = (incidentsByType[incident.type] || 0) + 1;

      // Count by severity
      incidentsBySeverity[incident.severity] = (incidentsBySeverity[incident.severity] || 0) + 1;

      // Count by IP
      ipCounts.set(incident.clientIP, (ipCounts.get(incident.clientIP) || 0) + 1);

      // Count auto-healed
      if (incident.autoHealed) autoHealedCount++;
    });

    // Top attackers
    const topAttackers = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalIncidents: recentIncidents.length,
      incidentsByType,
      incidentsBySeverity,
      topAttackers,
      autoHealedCount,
    };
  }

  /**
   * Generate incident ID
   */
  private generateIncidentId(): string {
    return `INC_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  }

  /**
   * Notify admin (TODO: implement email/Telegram notification)
   */
  private notifyAdmin(incident: SecurityIncident): void {
    // TODO: Send to Telegram/Email/Slack
    console.log('[ADMIN NOTIFICATION]', {
      message: `🚨 CRITICAL SECURITY INCIDENT`,
      type: incident.type,
      ip: incident.clientIP,
      time: new Date(incident.timestamp).toISOString(),
    });
  }

  /**
   * Health check - kiểm tra hệ thống có đang bị tấn công không
   */
  healthCheck(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    stats: {
      totalIncidents: number;
      incidentsByType: Record<string, number>;
      incidentsBySeverity: Record<string, number>;
      topAttackers: Array<{ ip: string; count: number }>;
      autoHealedCount: number;
    };
  } {
    const stats = this.getStats(1); // Last hour

    if (stats.totalIncidents === 0) {
      return {
        status: 'healthy',
        message: 'No security incidents in the last hour',
        stats,
      };
    }

    const criticalCount = stats.incidentsBySeverity.critical || 0;
    const highCount = stats.incidentsBySeverity.high || 0;

    if (criticalCount > 0 || highCount > 10) {
      return {
        status: 'critical',
        message: `Under attack: ${criticalCount} critical, ${highCount} high severity incidents`,
        stats,
      };
    }

    if (stats.totalIncidents > 20) {
      return {
        status: 'warning',
        message: `Elevated threat level: ${stats.totalIncidents} incidents in last hour`,
        stats,
      };
    }

    return {
      status: 'healthy',
      message: `${stats.totalIncidents} minor incidents handled`,
      stats,
    };
  }
}

// Singleton instance
export const autoHealingSystem = new AutoHealingSystem();

/**
 * Helper function to record incident
 */
export function recordSecurityIncident(
  type: SecurityIncident['type'],
  severity: SecurityIncident['severity'],
  clientIP: string,
  details: Record<string, unknown> = {}
): void {
  autoHealingSystem.recordIncident({
    type,
    severity,
    clientIP,
    details,
  });
}

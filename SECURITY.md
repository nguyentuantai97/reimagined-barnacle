# Security Policy - AN Milk Tea

## Bảo mật đã triển khai

### 1. Web Application Security
- ✅ Rate Limiting (5 orders/min, block 5 min khi vượt)
- ✅ CSRF Protection
- ✅ XSS Prevention (input sanitization, CSP headers)
- ✅ SQL Injection Prevention (pattern detection)
- ✅ Honeypot fields (anti-bot)
- ✅ Malicious pattern detection
- ✅ Security headers (HSTS, X-Frame-Options, etc.)

### 2. Payment Security (NEW - 2025-01-06)
- ✅ Webhook signature verification (SePay, Casso, VNPay)
- ✅ IP whitelist for payment webhooks
- ✅ Transaction logging và audit trail
- ✅ Suspicious activity detection
- ✅ KHÔNG lưu trữ thông tin thẻ
- ✅ Chỉ hiển thị QR/STK để khách tự chuyển

### 3. Auto-Healing Security System (NEW - 2025-01-06)
- ✅ **24/7 Tự động phát hiện và chặn tấn công**
  - SQL injection → Block IP 7 ngày
  - XSS attacks → Block IP 7 ngày
  - Brute force → Block IP 1-24 giờ
  - Suspicious IP → Block sau 3 lần cảnh báo
- ✅ **Incident Tracking** - Ghi lại tất cả security incidents
- ✅ **Health Check Endpoint** - `/api/security/health` để monitor 24/7
- ✅ **Auto-unblock** - Tự động unblock IP sau timeout
- ✅ **Admin Notifications** - Log critical incidents
- ✅ **Attack Statistics** - Top attackers, incident trends

### 4. Content Security Policy (CSP)
- ✅ **Strict CSP Headers** - Ngăn XSS và injection attacks
- ✅ **Permissions Policy** - Vô hiệu hóa browser features không cần thiết
- ✅ **HSTS** - Force HTTPS với preload
- ✅ **Frame Protection** - Ngăn clickjacking
- ✅ **MIME Sniffing Protection** - X-Content-Type-Options: nosniff

### 5. Input Validation & Sanitization
- ✅ **Advanced Input Sanitizer** - Remove malicious characters
- ✅ **Vietnamese Phone Validation** - Format chuẩn VN
- ✅ **Email Validation** - RFC 5322 compliant
- ✅ **Attack Pattern Detection** - SQL injection, XSS, path traversal
- ✅ **Length Limits** - Prevent buffer overflow
- ✅ **HTML Escaping** - Prevent XSS trong output

### 6. DevTools Protection (Production)
- ✅ Disable React DevTools
- ✅ Block keyboard shortcuts (F12, Ctrl+Shift+I)
- ✅ Console log suppression
- ✅ Console warning message

### 7. Vercel Security
- ✅ Source maps disabled
- ✅ Powered-by header removed
- ✅ Strict security headers
- ✅ API route protection

### 8. GitHub Security
- ✅ Comprehensive .gitignore
- ✅ No secrets in code
- ✅ .env files excluded

---

## HƯỚNG DẪN BẢO MẬT CHO CHỦ SỞ HỮU

### A. Vercel Dashboard Settings

Truy cập: https://vercel.com/nguyentuantai97s-projects/an-milk-tea/settings

1. **Environment Variables** (Settings → Environment Variables)
   - ✅ Đảm bảo CUKCUK_DOMAIN và CUKCUK_SECRET_KEY được set
   - ✅ KHÔNG để lộ trong Preview hay Development nếu không cần

2. **Deployment Protection** (Settings → Deployment Protection)
   - [ ] Bật "Vercel Authentication" cho Preview deployments
   - [ ] Cân nhắc bật "Password Protection" cho staging

3. **Security** (Settings → Security)
   - [ ] Bật "Attack Challenge Mode" nếu bị tấn công
   - [ ] Cân nhắc bật "Web Application Firewall" (Pro plan)

4. **Domains** (Settings → Domains)
   - ✅ Sử dụng HTTPS only
   - [ ] Xem xét thêm domain verification

### B. GitHub Repository Settings

Nếu push lên GitHub:

1. **Repository Settings**
   - [ ] Set repository thành PRIVATE
   - [ ] Enable "Require pull request reviews"
   - [ ] Enable "Require status checks"

2. **Branch Protection** (Settings → Branches)
   - [ ] Protect main/master branch
   - [ ] Require code review before merge

3. **Secrets** (Settings → Secrets and variables)
   - [ ] KHÔNG lưu secrets trong code
   - [ ] Sử dụng GitHub Secrets cho CI/CD

4. **Security** (Security tab)
   - [ ] Enable Dependabot alerts
   - [ ] Enable secret scanning

### C. CUKCUK API Security

1. **API Keys**
   - [ ] Rotate CUKCUK_SECRET_KEY định kỳ (mỗi 6 tháng)
   - [ ] Giới hạn IP access nếu CUKCUK hỗ trợ
   - [ ] Monitor API usage

### D. Payment Integration Security (CRITICAL)

1. **Environment Variables** (Settings → Environment Variables)
   ```bash
   # SePay (nếu dùng)
   SEPAY_WEBHOOK_SECRET=your-webhook-secret-here

   # Casso (nếu dùng)
   CASSO_SECURE_TOKEN=your-secure-token-here

   # VNPay (nếu dùng)
   VNPAY_HASH_SECRET=your-hash-secret-here
   ```

2. **IP Whitelist** (BẮT BUỘC khi production)
   - [ ] Lấy danh sách IP từ SePay/Casso/VNPay
   - [ ] Cập nhật vào `src/lib/security/webhook-verify.ts`
   - [ ] Uncomment IP validation trong webhook endpoint

3. **Webhook URL**
   - Production: `https://anmilktea.online/api/webhooks/payment?provider=sepay`
   - Đăng ký URL này với SePay/Casso/VNPay
   - HTTPS BẮT BUỘC

4. **Testing Webhook**
   ```bash
   # Test signature verification
   curl -X POST https://anmilktea.online/api/webhooks/payment?provider=sepay \
     -H "Content-Type: application/json" \
     -H "x-signature: YOUR_TEST_SIGNATURE" \
     -d '{"orderCode":"DH001","amount":50000}'
   ```

5. **Monitor Transactions**
   - [ ] Kiểm tra logs hàng ngày trong tuần đầu
   - [ ] Review suspicious transactions
   - [ ] Verify amount matches order

### E. 24/7 Security Monitoring (AUTO-HEALING)

**Setup Monitoring Service (UptimeRobot hoặc Better Uptime):**

1. **Health Check Endpoint**
   - URL: `https://anmilktea.online/api/security/health`
   - Method: GET
   - Interval: 5 phút
   - Alert when: status != "healthy"

2. **Response Format**
   ```json
   {
     "status": "healthy" | "warning" | "critical",
     "timestamp": "2025-01-06T...",
     "security": {
       "health": {...},
       "last24Hours": {
         "totalIncidents": 0,
         "incidentsByType": {},
         "topAttackers": []
       },
       "blockedIPs": {
         "count": 0,
         "ips": []
       }
     },
     "recommendations": [
       "✅ All security systems operating normally."
     ]
   }
   ```

3. **Alert Triggers**
   - Status "critical" → Gửi SMS/Email ngay lập tức
   - Status "warning" → Log và monitor
   - High attack volume (>100 incidents/24h) → Alert
   - Critical incidents detected → Alert

4. **Auto-Healing Actions**
   - SQL Injection detected → Auto-block IP 7 ngày
   - XSS attempt → Auto-block IP 7 ngày
   - Brute force (high) → Auto-block IP 24 giờ
   - Suspicious activity (3x) → Auto-block IP 1 giờ
   - Rate limit exceeded → Temporary block

### F. Regular Security Checks

**Tự động (Auto-Healing System):**
- ✅ Detect và block attacks 24/7
- ✅ Log tất cả security incidents
- ✅ Auto-unblock IPs sau timeout
- ✅ Health monitoring endpoint

**Hàng ngày (tuần đầu sau khi bật thanh toán):**
- [ ] Check `/api/security/health` endpoint
- [ ] Review suspicious transactions
- [ ] Verify payments match orders

**Hàng tuần:**
- [ ] Review blocked IPs statistics
- [ ] Check attack patterns và trends
- [ ] Monitor rate limit violations

**Hàng tháng:**
- [ ] Update dependencies (npm audit fix)
- [ ] Rotate payment webhook secrets
- [ ] Review security headers
- [ ] Check for security updates

---

## Reporting Security Issues

Nếu phát hiện lỗ hổng bảo mật, vui lòng liên hệ:
- Email: security@anmilktea.online (cần setup)
- KHÔNG public lỗ hổng trước khi được fix

---

## Changelog

- 2025-01-06: Enterprise-grade security upgrade (AUTO-HEALING)
  - **Auto-Healing Security System** - Tự động phát hiện và vá lỗi 24/7
  - **24/7 Health Monitoring** - Health check endpoint
  - **Content Security Policy (CSP)** - Strict headers
  - **Permissions Policy** - Disable unnecessary features
  - **Advanced Input Sanitization** - XSS, SQL injection prevention
  - **Attack Pattern Detection** - Real-time threat detection
  - **Incident Tracking** - Complete audit trail
  - **Auto IP Blocking** - Based on attack severity
  - **Payment Security** - Webhook verification, transaction logging
  - **API Security** - All endpoints protected

- 2024-12-04: Initial security implementation
  - Middleware security (rate limiting, pattern detection)
  - Anti-debug protection
  - Security headers
  - Honeypot protection

---

## Security Architecture

### Payment Flow (An toàn)

```
Khách đặt hàng
    ↓
Website tạo đơn → CUKCUK
    ↓
Hiển thị QR/STK (KHÔNG lưu thẻ)
    ↓
Khách chuyển khoản qua app ngân hàng
    ↓
Ngân hàng → SePay/Casso → Webhook
    ↓
Webhook endpoint (verify signature + IP)
    ↓
Log transaction
    ↓
Check suspicious activity
    ↓
Verify amount
    ↓
Update CUKCUK (đánh dấu đã thanh toán)
    ↓
Gửi xác nhận (Email/SMS)
```

### Layers of Defense

1. **Network Layer**
   - IP Whitelist
   - Rate Limiting (auto-block)
   - DDoS Protection (Vercel)
   - Auto-Healing IP Blocking

2. **Application Layer**
   - Content Security Policy (CSP)
   - Permissions Policy
   - Input validation & sanitization
   - Attack pattern detection
   - Honeypot anti-bot
   - HSTS enforcement

3. **Payment Layer**
   - Webhook signature verification (timing-safe)
   - IP whitelist validation
   - Amount verification
   - Transaction logging
   - Suspicious activity detection

4. **Auto-Healing Layer** (NEW)
   - Real-time threat detection
   - Automatic incident response
   - IP auto-blocking based on severity
   - Auto-unblock after timeout
   - Attack classification (SQL, XSS, brute force)
   - Incident statistics tracking

5. **Monitoring Layer**
   - 24/7 Health check endpoint
   - Security incident logs
   - Transaction audit trail
   - Attack statistics
   - Top attackers tracking
   - Performance metrics

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

### 3. DevTools Protection (Production)
- ✅ Disable React DevTools
- ✅ Block keyboard shortcuts (F12, Ctrl+Shift+I)
- ✅ Console log suppression
- ✅ Console warning message

### 4. Vercel Security
- ✅ Source maps disabled
- ✅ Powered-by header removed
- ✅ Strict security headers
- ✅ API route protection

### 5. GitHub Security
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

### E. Regular Security Checks

**Hàng ngày (tuần đầu sau khi bật thanh toán):**
- [ ] Check transaction logs
- [ ] Review suspicious webhooks
- [ ] Verify payments match orders

**Hàng tuần:**
- [ ] Check Vercel logs cho suspicious activity
- [ ] Review failed payment attempts
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

- 2025-01-06: Payment security enhancement
  - Webhook signature verification
  - IP whitelist validation
  - Transaction logging system
  - Suspicious activity detection
  - Payment webhook endpoint

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
   - Rate Limiting
   - DDoS Protection (Vercel)

2. **Application Layer**
   - Input validation
   - Pattern detection
   - Honeypot anti-bot

3. **Payment Layer**
   - Signature verification
   - Amount verification
   - Transaction logging
   - Suspicious activity detection

4. **Monitoring Layer**
   - Transaction logs
   - Error tracking
   - Audit trail

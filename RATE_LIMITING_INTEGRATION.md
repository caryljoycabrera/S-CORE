# Rate Limiting Integration Summary

## Overview
Comprehensive rate limiting middleware has been implemented to protect the S-CORE platform against abuse, brute force attacks, and DDoS attempts. The system uses context-specific limiters with role-based admin bypass.

## Implementation Details

### 1. Rate Limiter Middleware (`middleware/rateLimiter.js`)
7 distinct rate limiters configured for different use cases:

| Limiter | Limit | Window | Purpose | Admin Bypass |
|---------|-------|--------|---------|--------------|
| `apiLimiter` | 100 req/IP | 15 min | General API calls | ✓ Yes |
| `authLimiter` | 5 attempts/IP | 15 min | Login/Register attempts | ✗ No (counts failed only) |
| `strictLimiter` | 10 req/user | 1 hour | High-security operations | ✓ Yes |
| `messageLimiter` | 30 msg/user | 5 min | Message sending | ✓ Yes (admins exempt) |
| `uploadLimiter` | 20 uploads/user | 1 hour | File uploads | ✓ Yes |
| `requestLimiter` | 10 requests/user | 1 hour | Service request creation | ✓ Yes |
| `emailLimiter` | 5 emails/user | 1 hour | Email sending | ✓ Yes (admins exempt) |

**Features:**
- User ID-based limiting for authenticated requests (more accurate than IP)
- IP-based limiting for anonymous requests
- Admin users bypass rate limiting (role === 'admin')
- skipSuccessfulRequests enabled for auth limiter (only counts failed attempts)
- Standard HTTP header tracking (user-agent, forwarded-for, etc.)

### 2. Applied Rate Limiters

#### Authentication Routes (`routes/auth.js`)
```javascript
// Added import
const { authLimiter } = require('../middleware/rateLimiter');

// Applied to:
- POST /register        (authLimiter)  - Prevents registration spam
- POST /login          (authLimiter)  - Brute force protection
```

#### Messaging Routes (`routes/messages.js`)
```javascript
// Added import
const { messageLimiter } = require('../middleware/rateLimiter');

// Applied to:
- POST /messages/:conversationId/send  (messageLimiter)  - Message spam prevention
```

#### User Routes (`routes/user.js`)
```javascript
// Added import
const { requestLimiter } = require('../middleware/rateLimiter');

// Applied to:
- POST /submit-service-request      (requestLimiter)   - Service request spam
- POST /submit-request-approval     (requestLimiter)   - Approval request spam
```

#### API Routes (`routes/api.js`)
```javascript
// Added import
const { apiLimiter } = require('../middleware/rateLimiter');

// Applied to:
- GET /api/deadlines                (apiLimiter)       - Read-heavy endpoint
- GET /api/conversation/:requestId  (apiLimiter)       - Conversation access
- POST /api/conversation/:requestId/message  (apiLimiter) - Legacy message endpoint
```

### 3. Error Responses
When rate limit is exceeded, clients receive:

**HTTP Status:** 429 (Too Many Requests)

**Response Headers:**
- `Retry-After`: Time in seconds before next request
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Response Body (JSON):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### 4. Admin Bypass Logic
Users with `role === 'admin'` automatically bypass rate limiting on:
- apiLimiter
- strictLimiter
- messageLimiter
- uploadLimiter
- requestLimiter
- emailLimiter

This allows administrators to perform bulk operations without hitting limits.

### 5. Attack Prevention Scenarios

| Attack Type | Protection |
|-------------|-----------|
| Brute Force Login | authLimiter - 5 attempts/15min |
| Message Spam | messageLimiter - 30 msg/5min per user |
| Registration Spam | authLimiter - 5 registrations/15min |
| Request Spam | requestLimiter - 10 requests/hour |
| API Enumeration | apiLimiter - 100 req/15min per IP |
| Upload Attacks | uploadLimiter - 20 uploads/hour |
| Email Flooding | emailLimiter - 5 emails/hour |

### 6. Configuration

All rate limiters configured with:
- **standardHeaders**: true (include RateLimit-* headers)
- **legacyHeaders**: false (skip X-RateLimit-* headers for clarity)
- **message**: User-friendly error message
- **statusCode**: 429 (Too Many Requests)

Admin bypass applied via `skip` function:
```javascript
skip: (req, res) => {
  return req.user && req.user.role === 'admin';
}
```

### 7. Monitoring & Logging

Rate limiter hits are tracked via Express middleware. Recommended monitoring:
- Track 429 responses per IP/user ID
- Alert on repeated rate limit violations (potential attack)
- Monitor admin bypass usage for audit
- Set thresholds for auto-blocking persistent offenders

### 8. Client-Side Impact

Users hitting rate limits will see:
- Login: "Too many login attempts, please try again in 15 minutes"
- Messages: "Message sending temporarily limited, please wait"
- Requests: "Service request submission limit reached, try again later"
- API: "Too many requests, please try again later"

### 9. Bypass Options

**Legitimate use cases for high volume:**
1. Admins are automatically exempt from all limits
2. Email notifications can be throttled via `process.env.ENABLE_EMAIL_NOTIFICATIONS`
3. Bulk operations should use scheduled batch processes outside rate limiting
4. Service accounts should use separate authentication tokens with higher limits (future enhancement)

### 10. Database & Persistence

Rate limiter state is stored in-memory (default store). For distributed deployments:
- Upgrade to Redis store: `npm install rate-limit-redis`
- Configure Redis connection in production
- Ensure consistent rate limiting across multiple server instances

### 11. Testing Rate Limits

**Test Login Rate Limit (5 attempts/15min):**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8080/login \
    -d "username=test&password=wrong" \
    -c cookies.txt
done
# 6th attempt returns 429
```

**Test Message Rate Limit (30 msg/5min):**
```bash
# Create 31 messages rapidly
for i in {1..31}; do
  curl -X POST http://localhost:8080/messages/CONV_ID/send \
    -H "Cookie: sessionId=..." \
    -d "content=Test message $i"
done
# 31st message returns 429
```

### 12. Maintenance Notes

- Rate limiter state resets after window expires (no persistence between restarts)
- For production, migrate to Redis backend for consistency
- Regularly review rate limit thresholds based on user behavior
- Adjust limits upward if legitimate users hit limits frequently
- Use stricter limits for public/unauthenticated endpoints

### 13. Future Enhancements

1. **Redis Integration**: Distribute rate limiting across multiple instances
2. **Custom Limits**: Allow admins to set per-user rate limits via settings
3. **Gradual Slowdown**: Implement exponential backoff instead of hard blocks
4. **Whitelist**: Add IP whitelist for trusted integrations
5. **Analytics**: Track rate limit violations for security analysis
6. **Geo-blocking**: Combine with geo-IP limiting for additional security
7. **Rate Limit by Pattern**: Different limits for different request patterns

## Summary

Rate limiting is now active on:
- **6 route files**: auth.js, messages.js, user.js, api.js
- **7 unique limiters**: Covering authentication, messaging, requests, uploads, and general API
- **Role-based bypass**: Admins exempt from rate limiting
- **Error handling**: 429 responses with Retry-After headers

The system is protected against common API abuse patterns while remaining flexible for legitimate admin operations.

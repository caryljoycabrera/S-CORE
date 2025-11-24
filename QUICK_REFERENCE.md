# Quick Reference: Rate Limiting & Socket.IO Integration

## Rate Limiting Quick Start

### Using Rate Limiters in Routes

```javascript
// Import
const { authLimiter, messageLimiter, requestLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Apply to route
router.post('/login', authLimiter, async (req, res) => {
  // This endpoint is now rate limited
});

// With multiple middleware
router.post('/messages/send', messageLimiter, requireLogin, async (req, res) => {
  // Rate limit is checked first, then authentication
});
```

### Rate Limit Thresholds

```
authLimiter    = 5 requests / 15 minutes per IP
messageLimiter = 30 messages / 5 minutes per user
requestLimiter = 10 requests / 1 hour per user
apiLimiter     = 100 requests / 15 minutes per IP
```

### Testing Rate Limits

```bash
# Quick test - attempt 6 logins (limit is 5)
node test-rate-limiting.js login 6

# Test messages - attempt 31 messages (limit is 30)
node test-rate-limiting.js message 31

# Test API - attempt 101 API calls (limit is 100)
node test-rate-limiting.js api 101
```

### Client-Side Error Handling

When rate limited, users receive:
```
HTTP 429 (Too Many Requests)

Headers:
- Retry-After: 123 (seconds to wait)
- X-RateLimit-Remaining: 0

Body:
{ "message": "Too many requests, please try again later" }
```

---

## Socket.IO Real-Time Messaging

### Server-Side: Socket.IO Service

```javascript
// In services/socketService.js
const socketService = require('../services/socketService');

// Join conversation room
socketService.joinConversation(socketId, conversationId);

// Emit to conversation
socketService.emitToConversation(conversationId, 'newMessage', {
  content: 'Hello',
  sender: userId
});

// Typing indicator
socketService.emitTypingIndicator(conversationId, userId, userName, true);
```

### Client-Side: Messaging Handler

```javascript
// In public/javascripts/messaging-socket.js
// Automatically initialized on page load

// Join conversation
messagingSocket.joinConversation(conversationId);

// Emit typing
messagingSocket.emitTypingIndicator(userName);

// Handle events (auto-registered)
// - newMessage: updates DOM
// - messageEdited: shows edited label
// - messageDeleted: marks deleted
// - userTyping: shows typing indicator
// - messageRead: shows read receipt
// - userStatusChanged: updates online status
```

### View Integration

```ejs
<!-- In views/User/messages.ejs -->
<script src="/socket.io/socket.io.js"></script>
<script src="/javascripts/messaging-socket.js"></script>

<!-- Data attributes for socket identification -->
<div class="message" data-message-id="<%= msg._id %>" data-user-id="<%= msg.sender %>">
  <%= msg.content %>
</div>

<!-- Typing indicator -->
<div id="typingIndicator" style="display:none;">
  <em>User is typing...</em>
</div>
```

---

## Architecture Overview

### Rate Limiting Flow

```
HTTP Request
    ↓
Rate Limiter Middleware
    ↓
    ├─ Check: Has user/IP hit limit in window?
    │
    ├─ YES → Return 429 (Too Many Requests)
    │   └─ Include Retry-After header
    │
    └─ NO → Continue to route handler
        ├─ Check: Is user admin?
        │   ├─ YES → Skip rate limit check
        │   └─ NO → Apply rate limit
        └─ Process request
```

### Socket.IO Architecture

```
Server (socketService.js)
    ↓
Socket.IO Rooms (conversation-{id})
    ↓
├─ Emits: newMessage, messageEdited, messageDeleted, userTyping, messageRead
├─ Handles: joinConversation, leaveConversation, typing
└─ Connected Clients receive real-time updates

Client (messaging-socket.js)
    ↓
MessagingSocketHandler
    ↓
├─ Initialize: Connect and register 6 event listeners
├─ Send: emitTypingIndicator, markAsRead
└─ Receive: Handle real-time events and update DOM
```

---

## Common Use Cases

### Scenario 1: User Sends Too Many Messages

```
User tries to send message #31 within 5 minutes
    ↓
messageLimiter checks: 30 already sent in window
    ↓
Returns: HTTP 429
    ↓
Response includes: Retry-After: 210 (seconds)
    ↓
Client shows: "Message limit reached, try again in 3 minutes"
```

### Scenario 2: Admin Bulk Operations

```
Admin user sends 100 messages in 5 minutes
    ↓
messageLimiter checks: req.user.role === 'admin'
    ↓
Admin bypass: Skip (function)
    ↓
All 100 messages sent successfully
```

### Scenario 3: Real-Time Conversation

```
User opens conversation
    ↓
Socket.IO connects: messagingSocket.initialize()
    ↓
Join room: messagingSocket.joinConversation(convId)
    ↓
User types: emitTypingIndicator("John is typing...")
    ↓
Server broadcasts to room: userTyping event
    ↓
Other users see: "John is typing..." indicator
    ↓
User sends message: POST /messages/convId/send (messageLimiter)
    ↓
Server broadcasts: newMessage event to room
    ↓
All users see message in real-time (no page refresh)
```

---

## Monitoring & Debugging

### Check Rate Limit Status

```javascript
// In browser console
fetch('/api/deadlines')
  .then(r => {
    console.log('Remaining:', r.headers.get('X-RateLimit-Remaining'));
    console.log('Reset:', new Date(r.headers.get('X-RateLimit-Reset') * 1000));
  });
```

### Monitor Socket.IO Events

```javascript
// In browser console
messagingSocket.socket.on('*', (event, data) => {
  console.log('Socket event:', event, data);
});
```

### Server Logs

```bash
# Watch for rate limit hits (429 responses)
curl -X POST http://localhost:8080/login \
  -d "username=test&password=wrong" -w "\nStatus: %{http_code}\n"

# Should return 429 after 5 attempts
```

---

## Configuration

### To Change Rate Limits

Edit `middleware/rateLimiter.js`:

```javascript
// Change message limit from 30 to 50 per 5 minutes
const messageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,        // 5 minutes
  max: 50,                         // Change this from 30 to 50
  keyGenerator: (req, res) => req.user?._id || req.ip,
  // ... rest of config
});
```

### To Add New Rate Limiter

```javascript
// In middleware/rateLimiter.js
const customLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,       // 1 hour
  max: 20,                         // 20 requests
  message: 'Too many attempts',
  skip: (req, res) => req.user?.role === 'admin',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { 
  // ... other limiters
  customLimiter 
};
```

### To Apply to Route

```javascript
const { customLimiter } = require('../middleware/rateLimiter');

router.post('/custom-endpoint', customLimiter, async (req, res) => {
  // Now rate limited
});
```

---

## Best Practices

✅ **DO:**
- Apply appropriate limiter to each endpoint
- Use user ID for authenticated requests
- Include Retry-After in responses
- Log rate limit violations
- Test limits before production

❌ **DON'T:**
- Apply multiple limiters to same endpoint
- Disable limits for security-critical endpoints
- Set limits too high (defeats purpose)
- Forget to test with admin bypass
- Deploy without testing rate limits

---

## Troubleshooting

### Q: Rate limiter not working?
**A:** Check:
1. Limiter is imported: `const { limiter } = require(...)`
2. Limiter is applied: `router.post(path, limiter, handler)`
3. Server restarted after changes
4. User/IP correctly identified in logs

### Q: Admin still being rate limited?
**A:** Check:
1. `req.user.role === 'admin'` matches actual role value
2. User object exists on request: `console.log(req.user)`
3. Skip function properly configured

### Q: Socket.IO not updating in real-time?
**A:** Check:
1. Socket.IO script loaded: `<script src="/socket.io/socket.io.js">`
2. Client handler loaded: `<script src="/javascripts/messaging-socket.js">`
3. User joined room: `messagingSocket.joinConversation(convId)`
4. Browser console for errors
5. Server logs for socket events

### Q: How to test rate limits locally?
**A:** Use provided test script:
```bash
node test-rate-limiting.js [endpoint] [count]
# endpoint: login, register, message, api
# count: number of requests to send
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `middleware/rateLimiter.js` | Rate limiter definitions and exports |
| `routes/auth.js` | authLimiter applied to login/register |
| `routes/messages.js` | messageLimiter applied to message send |
| `routes/user.js` | requestLimiter applied to request creation |
| `routes/api.js` | apiLimiter applied to API endpoints |
| `services/socketService.js` | Socket.IO server-side handler |
| `public/javascripts/messaging-socket.js` | Socket.IO client-side handler |
| `views/User/messages.ejs` | Messaging UI with Socket.IO |
| `test-rate-limiting.js` | Test utility for rate limiting |
| `RATE_LIMITING_INTEGRATION.md` | Full documentation |

---

## Support

For detailed information, see:
- `RATE_LIMITING_INTEGRATION.md` - Complete guide
- `PHASE_5_2_IMPLEMENTATION_VERIFICATION.md` - Implementation details
- Code comments in modified files
- Test script: `test-rate-limiting.js`

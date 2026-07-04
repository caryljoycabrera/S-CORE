# S-CORE Security Audit

Date: 2026-07-03
Scope: Full application (Express 5 + EJS + Mongoose), branch `feat/no-file-uploads`
Method: Static code review across auth/authorization, injection/data-access, and secrets/XSS/config surfaces.

## Executive Summary

23 findings: **6 Critical, 7 High, 7 Medium, 3 Low**. The codebase has real security engineering in places (bcrypt, most IDOR ownership checks, a body-sanitization layer, HTML-escaping in the report service) — this is not a from-scratch rewrite. But several gaps are severe enough to allow full credential compromise, arbitrary file write, and stored XSS today.

**Fix this week:**
1. Rotate every secret in `.env` (Mongo Atlas, Session, Resend, Clerk, Azure AD) — the file is committed to git history.
2. Remove the hardcoded Mongo Atlas fallback credential duplicated across 5 source files.
3. Fix the path-traversal arbitrary-file-write in the profile-picture upload route.
4. Put auth in front of `/uploads` static file serving.
5. Sanitize/escape chat message content and the `displayFormattedText` HTML sinks (stored XSS).

---

## Critical

### C1 — `.env` committed to git with live secrets
`.env` is tracked in git (confirmed via `git ls-files` / `git log --all -- .env`, 3 commits), despite `.gitignore` listing it — it was committed before being ignored, so ignoring has no retroactive effect.

```
.env:6:  MONGO_URI=mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/
.env:9:  SESSION_SECRET=s-core-session-secret-key-2024
.env:22: RESEND_API_KEY=re_EZvUQj51_5uV4n9aqRhMUBTY46rFBWvWa
.env:40: CLERK_PUBLISHABLE_KEY=pk_test_a2luZC1jcm93LTYxLmNsZXJrLmFjY291bnRzLmRldiQ
.env:41: CLERK_SECRET_KEY=sk_test_Sex17tAi2ZPuFm2oYr4TyduqHbSaqEdBOfo0zNKr7Y
.env:45: AZURE_CLIENT_SECRET=dZZ8Q~kxIs8MR5YP3PenDWL1DJ2Bkb3AshJqEdyO
```

**Impact:** anyone with repo/clone access (including this branch) has live DB write access, can forge sessions, send email as the app, and access Azure AD app identity.

**Fix (manual, not automated by this audit):**
1. Rotate all listed credentials at their respective providers immediately.
2. `git rm --cached .env` and commit.
3. Scrub history (`git filter-repo` or BFG) since old commits still contain the values — a `.gitignore` entry alone does not remove them.
4. Load secrets from a secrets manager or untracked local `.env` going forward; consider `dotenv-safe` to fail startup when a required var is missing (prevents silent fallback to hardcoded defaults, see C2).

---

### C2 — Hardcoded MongoDB Atlas credential as fallback default
Same live credential as C1, hardcoded independently of `.env`, in 5 files:

```js
// config/database.js:7
const uri = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';
// server.js:82
mongoUrl: process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/',
// scripts/add-about-features.js:12, scripts/add-mission-vision-titles.js:12, scripts/seed-homepage.js:12 — same pattern
```

**Impact:** even after rotating and removing `.env`, any environment where `MONGO_URI` is accidentally unset silently reconnects to the (soon-to-be-rotated, but currently live) database — no loud failure.

**Fix — fail closed instead of falling back:**
```js
// config/database.js
const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error('MONGO_URI environment variable is required');
}
```
Apply the same pattern to `server.js:82` and the three `scripts/*.js` files. Also remove the `SESSION_SECRET` fallback at `server.js:78`:
```js
// server.js:78 — before
secret: process.env.SESSION_SECRET || 's-core-secret',
// after
secret: (() => { if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is required'); return process.env.SESSION_SECRET; })(),
```

---

### C3 — Path traversal → arbitrary file write (profile picture upload)
`routes/user.js:1665-1701`, route `POST /settings/profile-pic`, gated only by `requireLogin` (any authenticated user):

```js
const userId = req.user._id;
const fileName = `${userId}_${Date.now()}_${req.file.originalname}`;   // line 1672
const filePath = path.join(UPLOADS_DIR, fileName);                     // line 1673
fs.renameSync(req.file.path, filePath);                                // line 1676
```

`req.file.originalname` is the raw client-supplied filename (multer does not sanitize it). `path.join` normalizes `..` segments, so an `originalname` like `..\..\..\..\server.js` lets `fs.renameSync` move attacker-controlled content to an arbitrary path on disk, limited only by OS file permissions of the Node process. `fileFilter` in `config/upload.js` only checks the client-supplied MIME header, which is trivially spoofed.

Every other upload route in the codebase (`routes/user.js:932`, `routes/admin.js:2993`, `routes/unit.js:1272`) correctly uses the multer-sanitized `req.file.filename` instead — this route is the sole outlier.

**Fix:**
```js
// routes/user.js — use the already-sanitized multer filename, don't rebuild from originalname
const filePath = path.join(UPLOADS_DIR, req.file.filename);
// req.file.path already equals this if multer's storage engine wrote it there — verify no rename is even needed;
// if a rename is required, at minimum:
const safeName = `${userId}_${Date.now()}${path.extname(req.file.originalname).replace(/[^.\w]/g, '')}`;
const filePath = path.join(UPLOADS_DIR, safeName);
```

---

### C4 — Unauthenticated `/uploads` static file serving with predictable filenames
`server.js:64`:
```js
app.use('/uploads', express.static(UPLOADS_DIR));
```
No auth middleware at all, registered before session middleware. `config/upload.js` names most uploaded files from the original filename (e.g. `MyID.pdf`), not a random token — so any file referenced anywhere in the UI (or simply guessed) is fetchable by an unauthenticated request. This bypasses every ownership/IDOR check implemented at the API layer for request attachments, revision files, and profile pictures.

**Fix — serve through an authenticated, ownership-checked route instead of static hosting:**
```js
// routes/files.js (new authenticated route, replaces static /uploads mount)
router.get('/uploads/:filename', requireLogin, async (req, res) => {
  const filename = path.basename(req.params.filename); // strip any path segments
  const owningRecord = await findRecordByFilename(filename); // whatever lookup applies per file type
  if (!owningRecord) return res.status(404).end();
  const isOwner = owningRecord.userId.toString() === req.user._id.toString();
  const isAdminOrUnit = ['admin', 'unit'].includes(req.session.role);
  if (!isOwner && !isAdminOrUnit) return res.status(403).end();
  res.sendFile(path.join(UPLOADS_DIR, filename));
});
```
Remove the `express.static('/uploads', ...)` mount in `server.js:64`. Medium-term: move to randomized storage keys (not derived from original filename) so filenames aren't guessable even pre-auth-fix.

---

### C5 — Stored XSS in chat messages
`routes/messages.js` (`POST /messages/:conversationId/send`, lines ~174-201) stores `content: content.trim()` from `req.body.content` with no HTML sanitization. `views/User/messages.ejs:456-495` (client-side) renders it via `innerHTML`:

```js
mainContent.innerHTML = `
    ${conversation.messages.map(msg => `
        <div class="message-content">${msg.content === '[Message deleted]' ? '<em>...' : (msg.content || '')}</div>
    `).join('')}
`;
```

Any user can send `<img src=x onerror=alert(document.cookie)>` as a message; it executes in the recipient's (or admin's) browser session when they open the conversation — full session compromise, defeating the `httpOnly` cookie protection.

Also `messages.ejs:400-409` interpolates `user.fName`/`lName`/`email` into both HTML text and an inline `onclick="startConversationWith('${user._id}', '${user.fName} ${user.lName}')"` attribute. `utils/sanitize.js`'s `sanitizeName()` explicitly allows the `'` character, so a crafted name can break out of that single-quoted JS-string context.

**Fix — escape on render (immediate) + sanitize on write (defense in depth):**
```js
// client-side render fix — escape before inserting into innerHTML
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
// ...
<div class="message-content">${msg.content === '[Message deleted]' ? '<em>[Message deleted]</em>' : escapeHtml(msg.content)}</div>
```
For the `onclick` attribute pattern, don't build handlers via string interpolation at all — use `data-*` attributes and an event listener:
```html
<div class="search-result-item" data-user-id="${escapeHtml(user._id)}" data-fname="${escapeHtml(user.fName)}" data-lname="${escapeHtml(user.lName)}">
```
```js
document.querySelectorAll('.search-result-item').forEach(el =>
  el.addEventListener('click', () => startConversationWith(el.dataset.userId, `${el.dataset.fname} ${el.dataset.lname}`))
);
```
Server-side, sanitize `content` on write with `sanitize-html` (add as a dependency — none exists in the project currently):
```js
const sanitizeHtml = require('sanitize-html');
content: sanitizeHtml(req.body.content.trim(), { allowedTags: [], allowedAttributes: {} })
```

---

### C6 — Bypassable `displayFormattedText()` "sanitizer" (5 duplicated copies)
`public/javascripts/ejs/services.js:441`, `allrequestsadmin.js:2550` and `:3717`, `approvals.js:3381`, `Unit/alltasks.js:2993` all implement the same flawed logic:

```js
function displayFormattedText(text) {
    if (!text) return '';
    if (typeof text === 'string' && /<\/?(p|div|strong|b|em|i|u|a|br|span)[\s>]/i.test(text)) {
        return text;   // returned completely UNESCAPED if it merely contains a tag name
    }
    let formatted = escapeHtml(text);
    ...
}
```
This is a substring test, not a parser — `<a href="javascript:alert(1)">x</a>` or `<span onmouseover="alert(1)">x</span>` both match the "has HTML" branch and are returned raw, then injected via `innerHTML`. Underlying fields (`revisionNotes`, `responseNotes`, `description`) have no server-side sanitization either (`routes/user.js:1389,1550`, `routes/unit.js:1547,1801`) — an attacker can bypass the client editor entirely via a direct API call.

**Fix — replace with a real allowlist sanitizer, applied server-side (authoritative) and optionally client-side:**
```js
// server-side, wherever revisionNotes/responseNotes/description are written
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(rawInput, {
  allowedTags: ['p', 'div', 'strong', 'b', 'em', 'i', 'u', 'br', 'span'],
  allowedAttributes: {} // no href, no on* handlers, no style
});
```
Delete the 5 duplicated `displayFormattedText` implementations and replace with a single shared client-side helper that only escapes (rendering trust moves server-side where sanitize-html runs once, authoritatively).

---

## High

### H1 — No CSRF protection; session cookie missing `sameSite`
No CSRF library or token pattern anywhere (`grep -ri csrf` across the repo: zero hits). `server.js:88-92` session cookie config sets `secure`/`httpOnly`/`maxAge` but no `sameSite`. Every mutating route (password change, role change, request delete/edit, announcements) relies solely on the session cookie for auth.

**Fix:**
```js
// server.js — cookie config
cookie: {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax', // or 'strict' if no cross-site navigation flows are needed
  maxAge: 24 * 60 * 60 * 1000
}
```
Add token-based CSRF protection for state-changing routes, e.g. `csrf-csrf`:
```js
const { doubleCsrf } = require('csrf-csrf');
const { generateToken, doubleCsrfProtection } = doubleCsrf({ getSecret: () => process.env.SESSION_SECRET });
app.use(doubleCsrfProtection); // after session middleware
```

### H2 — No `helmet()` / security headers configured
No CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS, or `Referrer-Policy` anywhere. Given the confirmed XSS findings (C5/C6), there is no CSP to limit their blast radius (e.g. blocking inline scripts, restricting `script-src`).

**Fix:**
```js
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // tighten further once inline <script> blocks are audited/nonced
      objectSrc: ["'none'"],
    }
  }
}));
```

### H3 — Missing auth middleware entirely on several routes
`routes/api.js`:
```
POST /api/add-organization       (line 24)  — no auth, no rate limiter, mutates global SystemSettings
POST /api/add-office             (line 50)  — same
GET  /admin/request-volume       (line 1342) — no auth at all, exposes internal analytics
GET  /admin/active-tasks-by-unit (line 1407) — no auth at all, exposes per-unit workload data
```
These sit under an `/admin` path prefix inside `routes/api.js` (not `routes/admin.js`) with zero per-route middleware — the path prefix gives no protection by itself in Express.

**Fix:**
```js
router.post('/add-organization', requireAdmin, async (req, res) => { ... });
router.post('/add-office', requireAdmin, async (req, res) => { ... });
router.get('/admin/request-volume', requireAdmin, async (req, res) => { ... });
router.get('/admin/active-tasks-by-unit', requireAdmin, async (req, res) => { ... });
```

### H4 — Missing `requireAdmin` on admin-labeled profile routes
`routes/admin.js:565` (`GET /admin/profile`), `:2901` (`POST /admin/profile/change-password-popup`), `:2945` (`POST /admin/profile/request-password-reset`) only do a manual `if (!req.session.userId)` check — any authenticated non-admin user can reach admin-labeled endpoints. `:2945` additionally returns the raw `resetToken` in the JSON response body.

**Fix:**
```js
router.get('/profile', requireAdmin, async (req, res) => { ... });
router.post('/profile/change-password-popup', requireAdmin, async (req, res) => { ... });
router.post('/profile/request-password-reset', requireAdmin, async (req, res) => {
  // ...
  res.status(200).json({ success: true, message: 'Password reset link sent to your email' }); // drop resetToken from response
});
```

### H5 — `requireLogin` doesn't set `req.user`, but callers assume it does
`middleware/auth.js:10-18` only checks `req.session.userId` and redirects on failure — it never loads/sets `req.user`. Yet `routes/messages.js` (all routes) and several `routes/user.js` settings routes (`/settings/password`, `/settings/account`, etc.) do `const userId = req.user._id;` immediately after. This likely throws into a catch block returning 500 — a functional bug that happens to fail closed rather than an authorization bypass, but needs runtime verification since it may mean these features (messaging, password/account settings) are currently broken.

**Fix — standardize on `requireAuth` (which does set `req.user`) for any route that reads `req.user`:**
```js
// routes/messages.js, routes/user.js settings routes
router.post('/settings/password', requireAuth, async (req, res) => { ... }); // was requireLogin
```

### H6 — `req.query` sanitization is a silent no-op under Express 5
`middleware/sanitize.js` does `req.query = sanitizeRequestBody(req.query)`, but Express 5's `req.query` is a getter-only accessor in non-strict mode — the assignment silently does nothing (verified empirically). Currently masked because Express 5 defaults to the `'simple'` query parser (no bracket notation, so `?field[$ne]=` doesn't parse into a nested object) — but this is an accidental mitigation, not a real one.

**Fix — sanitize at the point of use instead of relying on reassignment:**
```js
// middleware/sanitize.js
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    const cleaned = sanitizeRequestBody(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key]; // mutate in place — getter has no setter, but the object itself IS mutable
    Object.assign(req.query, cleaned);
  }
  next();
}
```
(Mutating the existing query object's own properties works even though replacing the whole `req.query` reference does not.) Verify with a unit test that `req.query.foo` reflects sanitized output after this middleware runs.

### H7 — Sensitive `User` fields not excluded by default
`models/User.js` doesn't set `select: false` on `password`, `passwordResetToken`, `verificationToken`. Every plain `User.find()`/`findById()` (e.g. admin dashboard listing, `routes/admin.js:78`) loads these into memory by default. Some code paths even use `.select('+password')`, implying the authors believed the field was already excluded.

**Fix:**
```js
// models/User.js
password: { type: String, required: true, select: false },
passwordResetToken: { type: String, select: false },
verificationToken: { type: String, select: false },
```
Then explicitly `.select('+password')` only where login/password-change logic needs it (already done in `routes/user.js:1808,1971` — this fix makes that call meaningful instead of a no-op).

---

## Medium

### M1 — Unescaped regex construction from user input (ReDoS / pattern injection)
Admin-gated but unreviewed: `routes/admin.js:3152`, `:3169-3170`, `:6598`, `:6621-6622` build `new RegExp(userInput, 'i')` directly; `routes/api.js:187,202-204` builds `$regex` queries via `sanitizeString()`, which trims/strips null bytes but does not escape regex metacharacters.

**Fix:**
```js
const { escapeRegex } = require('../utils/sanitize'); // already exists, already used correctly in routes/auth.js
query.status = new RegExp(escapeRegex(status), 'i');
```

### M2 — Mass assignment via unrestricted `updates` object
`routes/admin.js:3800-3815` (`PUT /admin/request/edit`, admin-gated): `Model.findByIdAndUpdate(requestId, { $set: updates }, ...)` where `updates` is the raw client body with no field whitelist (top-level `$`-keys are stripped by global sanitization, but any schema field, e.g. `userId`, `isDeleted`, is settable).

**Fix — whitelist explicitly, matching the pattern already used elsewhere in the same file (e.g. lines 1652-1696):**
```js
const ALLOWED_FIELDS = ['status', 'assignedUnits', 'finalRemarks', 'priority']; // adjust to actual editable fields
const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k)));
const request = await Model.findByIdAndUpdate(requestId, { $set: safeUpdates }, { new: true, runValidators: true }).populate('userId');
```

### M3 — Raw EJS output (`<%- %>`) instead of escaped (`<%= %>`) for DB-sourced text
`views/homepage.ejs:179` (`card.contactInfo` — a regex wraps emails in `<a>` but doesn't escape the rest of the string first); `views/Unit/partials/recent-activity.ejs:6`, `views/Unit/unitdashboard.ejs:634`, `views/Unit/unitdashboard_temp.ejs:400`, `views/User/userPage.ejs:1839` (`activity.description`).

**Fix:** switch to `<%= %>` (auto-escaped) unless the field is guaranteed to be pre-sanitized HTML:
```ejs
<%# homepage.ejs:179 — escape first, then apply the email-link regex to the escaped string %>
<p style="white-space: pre-line;"><strong><%- escapeHtml(card.contactInfo).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>') %></strong></p>
```

### M4 — `JSON.stringify()` inside inline `<script>` blocks via `<%- %>`
~20+ view files embed `<%- JSON.stringify(data) %>` inside `<script>` tags. `JSON.stringify` doesn't escape `<`, `</script>`, or U+2028/2029 — a string field containing `</script><script>...` breaks out of the block. No `sanitize-html`/DOMPurify dependency exists in the project to guard the underlying admin-editable fields (announcements, settings).

**Fix — escape the dangerous sequences after stringifying:**
```js
// add a small helper, e.g. in a shared EJS helpers file
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/ /g, '\\u2028')
    .replace(/ /g, '\\u2029');
}
```
```ejs
const announcementsData = <%- safeJsonForScript(announcements || []) %>;
```

### M5 — `analyticsData.printHTML` passed unescaped to Puppeteer `page.setContent()`
`routes/admin.js:5133` passes client-supplied `req.body.analyticsData` straight to `reportService.generateAnalyticsPDF()`, which calls `page.setContent(analyticsData.printHTML)` with no escaping — server-side HTML/JS injection into a headless Chromium context. `--no-sandbox` is set on the Puppeteer launch args, which increases the severity if this were ever chained with an SSRF/file-read attempt from within the rendered page.

**Fix:** either escape/sanitize `printHTML` before use, or (better) don't accept pre-rendered HTML from the client at all — reconstruct the report HTML server-side from the underlying data fields (as `generatePDF`/`generateReport` already do correctly elsewhere in the same file, using `this.escapeHtml()`).

### M6 — Passport session middleware never registered
`passport.authenticate('microsoft', ...)` is used in `routes/clerk.js`, but `passport.initialize()`/`passport.session()` are never called in `server.js`. `req.logout()` (called in `routes/user.js:2014`) may not exist on `req` at runtime. Needs live verification.

**Fix:** either register `app.use(passport.initialize())` / `app.use(passport.session())` in `server.js` if the Passport-Microsoft flow is still in active use, or remove the dead `req.logout()` call / Passport dependency if Clerk fully superseded it.

### M7 — `/register` uses a permissive rate limiter
`routes/auth.js` applies `apiLimiter` (100 requests/15min) to `/register` instead of a stricter limiter like `authLimiter` (5/15min used on `/login`) — allows faster account-creation abuse/enumeration.

**Fix:**
```js
router.post('/register', authLimiter, async (req, res) => { ... }); // or a dedicated registerLimiter, e.g. 10/hour
```

---

## Low

### L1 — Unescaped filename in `Content-Disposition` header
`routes/admin.js:4818`: `` res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`) `` — `report.fileName` derives from `req.body.fileName`. A `"` in the value breaks the quoted attribute (Node blocks raw CRLF, so full header-splitting isn't possible, but parameter-boundary spoofing is).

**Fix:**
```js
const safeFileName = String(report.fileName).replace(/"/g, '');
res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
```

### L2 — Verbose logging of PII/session data
`middleware/auth.js` (`requireUnit`) logs user id/email/role/unitTeam on every request; `routes/auth.js` logs login-attempt details. Verify log retention/access controls, or reduce to non-PII fields.

### L3 — Password reset token returned in JSON response body
`routes/user.js:892-919`, `routes/admin.js:2945-2972` return `resetToken` directly in the API response in addition to emailing it — defeats "prove email ownership," and risks leaking via logs/proxy history. Requires an existing valid session to exploit, so severity is low, but still worth removing (see fix in H4).

---

## What's Already Solid

- Passwords hashed with bcrypt (cost factor 10); no MD5/SHA1/plaintext comparisons found anywhere.
- No SQL injection surface — Mongo/Mongoose only, no raw SQL driver, no string-concatenated queries.
- No `eval`/`Function()`/`child_process.exec`/dynamic `require()` usage anywhere in the codebase.
- `utils/sanitize.js` + `middleware/sanitize.js` provide a real sanitization layer (`sanitizeMongoId`, `escapeRegex`, body-level `$`-key stripping) and are used correctly in most of `routes/api.js` and `routes/auth.js` (e.g. login lookups correctly use `escapeRegex`).
- Strong IDOR/ownership checks across most of `routes/api.js`, `routes/unit.js`, and `routes/messages.js` — role-based branching (admin/unit/owner) is the norm, not the exception.
- `services/reportService.js` HTML report generation (`generatePDF`, `generateReport`, `generateHTML`) consistently escapes via `this.escapeHtml()` before interpolation.
- Registration and profile-update routes explicitly whitelist destructured fields before building Mongoose update objects — no mass-assignment issue there.
- Multer filename generation is safe (uses sanitized on-disk names) everywhere except the one flagged route (C3).
- Rate limiting exists on `/login` (5/15min).
- OAuth callback (`routes/clerk.js`) re-checks `status`/`emailVerified`/`isDeleted` before establishing a session — good parity with local login.

---

## Remediation Roadmap

**Do immediately (manual, outside this report's automated scope):**
- Rotate all secrets in `.env` (Mongo Atlas, Session, Resend, Clerk, Azure AD).
- Remove `.env` from git tracking and scrub git history.

**This sprint (Critical + High code fixes):**
- C2–C6, H1–H7 (see fixes above).

**Backlog (Medium + Low):**
- M1–M7, L1–L3 (see fixes above).

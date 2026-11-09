// Scenes: Security and API.
// Each scene = a title plus steps. A step moves the packet along `path`,
// marks tables as `read` / `write` / `active`, and shows a caption and the SQL.
defineScenes([
 {name:"Security log",title:"Attack monitoring (SecurityEvents)",steps:[
  {path:["customer","web"],cap:"Attempts the app sees are recorded: failed logins, locked accounts, wrong-role page requests, rate-limit hits, rejected forged/expired forms.",sql:"LoginFailed, AccountLocked, AccessDenied,\nRateLimited, AntiforgeryRejected"},
  {path:["web","back","SecurityEvents"],write:["SecurityEvents"],cap:"SecurityMonitor writes one row per event: type, e-mail, IP, path. Never a password or token. A logging failure can never break the request.",sql:"INSERT INTO dbo.SecurityEvents\n(Type, Email, IpAddress, Path, Detail)\nVALUES (...);"},
  {path:["SecurityEvents","back","SecurityEvents"],read:["SecurityEvents"],cap:"SecurityAlerter counts events in a 10-minute window (e.g. many failed logins from one IP across several accounts). A single failed login never alerts anyone.",sql:"SELECT COUNT(*) FROM dbo.SecurityEvents\nWHERE IpAddress = @ip\n  AND CreatedAt > @windowStart;"},
  {path:["SecurityEvents","back","mail"],active:["mail"],cap:"Over the threshold, admins get an e-mail (max one per category per 30 minutes). It says honestly that these are attempts, not a confirmed breach.",sql:"alert -> all active Admins"},
  {path:["mail","back","web","customer"],cap:"Admins read the events on /Admin/SecurityLog. Old rows are pruned by the daily cleanup job, because an IP address is personal data.",sql:"GET /Admin/SecurityLog"}
 ]},
 {name:"JWT API",title:"JSON API with JWT (/api)",steps:[
  {path:["customer","web","back"],cap:"A signed-in user (cookie, so e-mail link / TOTP already done) asks for a token.",sql:"POST /api/auth/token"},
  {path:["back","Users"],read:["Users"],cap:"The account is looked up again so a deleted or deactivated user gets no token.",sql:"users.FindById(userId)"},
  {path:["Users","back","web","customer"],cap:"A short-lived JWT is returned. The API accepts only a bearer token, never the cookie, and the pages ignore bearer tokens - so a forged form from another site cannot act through /api.",sql:"Authorization: Bearer eyJ..."},
  {path:["customer","web","back","Users"],read:["Users"],cap:"API policies check the role claim: any user, staff, or admin only.",sql:"ApiAnyUser / ApiStaff / ApiAdmin"}
 ]},
 {name:"Security",title:"Security overlay (STRIDE)",steps:[
  {path:["customer","web"],cap:"Spoofing: strong password policy + PBKDF2, e-mail link or TOTP as second factor, reCAPTCHA, lockout escalation, rate limiting per IP, HttpOnly/SameSite cookie with SecurityStamp, 30 min idle timeout, HTTPS + HSTS.",sql:"PasswordHasher, PendingLogins,\nLoginLockoutTracker, RateLimiter"},
  {path:["web","back"],cap:"Tampering: antiforgery token on every form (CSRF), server-side validation, prices and stock always re-read from the database, open-redirect check on returnUrl, parameterized SQL only.",sql:"IsSafeLocalUrl(returnUrl)\ncmd.Parameters.AddWithValue(...)"},
  {path:["back","AuditLog"],write:["AuditLog"],cap:"Repudiation: every admin/employee write is recorded in AuditLog with actor and time, attack attempts in SecurityEvents; order lines are snapshots.",sql:"audit.Record(...)"},
  {path:["AuditLog","back","Orders"],read:["Orders"],cap:"Information disclosure: IDOR checks (order id + user id), same reply for unknown e-mail on reset AND on register (no user enumeration), only hashes of tokens stored, TOTP secret encrypted, CSP and security headers, no passwords in logs.",sql:"FindForUser(orderId, userId)"},
  {path:["Orders","back","web"],active:["web","back"],cap:"Denial of service: sliding-window rate limiter on Login, Register and ForgotPassword (50 per minute per IP), login delay escalation, rate-limit hits recorded and alerted, UPDLOCK keeps checkout consistent under load.",sql:"429 Too Many Requests"},
  {path:["web","back","Users"],read:["Users"],cap:"Elevation of privilege: role claim checked with [Authorize(Roles)] on every staff page, extra checks inside shared pages, staff cannot buy, nobody can promote themselves, the last Admin cannot be removed.",sql:"[Authorize(Roles = \"Admin\")]\nif (!User.IsInRole(\"Admin\")) return Forbid();"}
 ]}
]);

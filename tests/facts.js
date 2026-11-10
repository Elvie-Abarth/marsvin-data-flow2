// Accuracy facts: claims the scenes make about the real Marsvin app.
// Each fact was checked against the real source (repo Elvie-Abarth/marsvin-webshop,
// folder marsvin-web/) on 2026-11-10. `src` says where. If the real app changes, update the fact AND the
// scene text together - a failing test here means the animation and the claim have drifted apart.
//
//   scene : scene name        has : text that must appear in that scene's captions + SQL (all steps)
//   lacks : text that must NOT appear (old wrong claims)
const FACTS = [
  // --- passwords ---
  {scene:"Register", has:"min 12 characters (15 for admins)", src:"Models/PasswordPolicy.cs MinLength=12, AdminMinLength=15"},
  {scene:"Password", has:"12+ chars, 15 for admins",          src:"Models/PasswordPolicy.cs"},
  {scene:"Register", has:"marsvin",                           src:"PasswordPolicy ShopBlocklist (marsvin, guineapig, ...)"},
  // --- tokens and sessions ---
  {scene:"Register", has:"NOW + 15 min",                      src:"Pages/Account/Register.cshtml.cs ConfirmationValidFor=15min"},
  {scene:"Login",    has:"15 min",                            src:"Pages/Account/Login.cshtml.cs ConfirmationValidFor=15min"},
  {scene:"Login",    has:"5 min token",                       src:"Pages/Account/Login.cshtml.cs TotpValidFor=5min"},
  {scene:"Login",    has:"30 min idle or 8 h at most",        src:"Data/AuthCookiePrincipal.cs IdleTimeout=30min, MaxSessionAge=8h"},
  {scene:"Login",    has:"SameSite=Lax",                      src:"Program.cs cookie SameSite=Lax, HttpOnly"},
  {scene:"Login",    has:"Delay 3^n seconds, 3rd failure e-mails the owner, 5th hard-locks", src:"Data/LoginLockoutTracker.cs"},
  {scene:"Register", has:"SHA-256",                           src:"Data/SqlPendingLoginStore.cs Hash()"},
  // --- security ---
  {scene:"Security", has:"50 per minute per IP",              src:"Program.cs RateLimiting:AuthPermitLimit=50, 1 min window"},
  {scene:"Security", has:"30 min idle timeout",               src:"Data/AuthCookiePrincipal.cs"},
  {scene:"Security log", has:"10-minute window",              src:"Data/SecurityAlerter.cs Window=10min"},
  {scene:"Security log", has:"max one per category per 30 minutes", src:"Data/SecurityAlerter.cs Cooldown=30min"},
  {scene:"JWT API",  has:"ApiAnyUser / ApiStaff / ApiAdmin",  src:"Data/ApiEndpoints.cs policies"},
  // --- GDPR ---
  {scene:"GDPR", has:"After 2 years of inactivity customer accounts", src:"InactiveAccountCleanupService InactivityThreshold=2y, Customer role only"},
  {scene:"GDPR", has:"2 months and 1 month before",           src:"InactiveAccountCleanupService 60d / 30d lead times"},
  {scene:"GDPR", has:"pruned after 90 days",                  src:"InactiveAccountCleanupService SecurityEventRetention=90d"},
  {scene:"GDPR", has:"DELETE FROM dbo.Shifts",                src:"Data/SqlUserAccountStore.cs DeleteUser"},
  {scene:"GDPR", has:"DELETE FROM dbo.TimeOffRequests",       src:"Data/SqlUserAccountStore.cs DeleteUser"},
  {scene:"GDPR", has:"DELETE FROM dbo.PendingLogins",         src:"Data/SqlUserAccountStore.cs DeleteUser"},
  {scene:"GDPR", has:"SET UserId = NULL",                     src:"Data/SqlUserAccountStore.cs DeleteUser keeps orders"},
  // --- shop ---
  {scene:"Cart", has:"MERGE dbo.CartItems",                   src:"Data/SqlCartStore.cs"},
  {scene:"Checkout", has:"UPDLOCK, HOLDLOCK",                 src:"Data/SqlOrderStore.cs"},
  {scene:"Checkout", has:"at least 4 weeks old",              src:"Models/Animal.cs IsOldEnoughToSell: AgeInWeeks() >= 4"},
  {scene:"Checkout", has:"PostNord / GLS / DAO",              src:"Models/Shipping.cs ShippingCarrier"},
  {scene:"Admin orders", has:"Cancelling is a separate action", src:"SqlOrderStore.UpdateStatus rejects Cancelled; Cancel() restocks"},
  // --- things that used to be wrong ---
  {scene:"Browse", lacks:"Promotions", src:"Public pages never read Promotions (only Pages/Admin/Promotions does)"}
];

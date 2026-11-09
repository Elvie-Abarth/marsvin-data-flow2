// The order of the tabs / autoplay. Add a new scene here after defining it in a js/scenes/*.js file.
const SCENE_ORDER = ["Overview", "Browse", "Search", "Register", "Login", "Cart", "Checkout", "Order history", "Password", "TOTP", "Admin shop", "Admin orders", "Security log", "JWT API", "Contact & donations", "Logbog", "Staff", "GDPR", "Security"];
const SCENES = SCENE_ORDER.map(name => {
  if (!SCENE_DEFS[name]) throw new Error("Scene not defined: " + name);
  return SCENE_DEFS[name];
});

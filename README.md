# Marsvin data-flow animation

An interactive presentation of how data flows from the browser through the Razor Pages and Stores
to the SQL Server database, plus all project diagrams.

**Open `index.html` in a browser.** No build step and no server needed. The Diagrams tab needs
internet once to load the Mermaid renderer.

## Folder layout

```
index.html            page structure + script order
css/style.css         all styling
js/
  schema.js           the database tables/columns shown in the side panel
  stage.js            draws the nodes, wires and the packet (SVG)
  scenes/
    registry.js       defineScenes() helper
    shop.js           Overview, Browse, Search, Cart, Checkout, Order history
    accounts.js       Register, Login, Password, TOTP, GDPR
    admin.js          Admin shop, Admin orders, Logbog, Staff, Contact & donations
    security.js       Security log, JWT API, Security (STRIDE)
    order.js          the order the scenes play in (tab order)
  animation.js        engine: routes the packet, highlights, timing, speed
  diagram-data.js     GENERATED - the .mermaid sources (see tools/)
  diagrams.js         the Diagrams tab (list, live rendering, zoom)
  app.js              startup: tabs, buttons, keys
tools/
  build-diagram-data.py   regenerates js/diagram-data.js from the repo's diagrams/ folder
```

## Common changes

- **Edit a scene's text or SQL:** open the file in `js/scenes/` that contains it.
- **Add a scene:** add it to a `js/scenes/*.js` file with `defineScenes([...])`, then add its name to
  `SCENE_ORDER` in `js/scenes/order.js`.
- **Add a table:** add it to `SCHEMA` and `PURPOSE` in `js/schema.js`.
- **Add or update a diagram:** edit the `.mermaid` file in the repo's `diagrams/` folder, then run
  `python tools/build-diagram-data.py`.

Keyboard: left/right arrows = previous/next scene, space = pause/play.

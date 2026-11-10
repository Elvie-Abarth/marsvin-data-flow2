# Marsvin data-flow

When the user says "start project" (or similar), run the site on http://localhost:5173:

1. Check if it is already up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`
2. If not, start it in the background from the project root: `python tools/serve.py 5173` (run_in_background).
3. Open http://localhost:5173 in the browser (`Start-Process http://localhost:5173`).

Always use port 5173. Never open `index.html` via file://.

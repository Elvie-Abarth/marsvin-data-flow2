"""Local dev server on a fixed port (default 5173) that tells the browser never to cache,
so edits show up on a normal refresh.

    python tools/serve.py [port]
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', PORT), NoCache).serve_forever()

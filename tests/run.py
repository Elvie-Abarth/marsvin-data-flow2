"""Runs tests/index.html in headless Chrome/Edge and prints the result. Exit code 1 if any test fails.

    python tests/run.py
"""
import html
import pathlib
import re
import shutil
import subprocess
import sys

BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
sys.stdout.reconfigure(encoding="utf8", errors="replace")
browser = next((b for b in BROWSERS if pathlib.Path(b).exists()), None) or shutil.which("chrome") or shutil.which("msedge")
if not browser:
    sys.exit("No Chrome or Edge found. Open http://localhost:5173/tests/ in a browser instead.")

page = pathlib.Path(__file__).with_name("index.html").resolve().as_uri()
dom = subprocess.run(
    [browser, "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
     "--virtual-time-budget=5000", "--dump-dom", page],
    capture_output=True, text=True, timeout=60, encoding="utf8", errors="replace",
).stdout

summary = re.search(r'<div id="sum">(.*?)</div>', dom, re.S)
if not summary:
    sys.exit("Could not read the test page output.")
print(html.unescape(re.sub(r"<[^>]+>", "", summary.group(1))))
for m in re.finditer(r'<li class="bad">(.*?)</li>', dom, re.S):
    print(html.unescape(re.sub(r"<br>", "\n", re.sub(r"&nbsp;", " ", m.group(1)))).replace("<code>", "").replace("</code>", ""))
sys.exit(1 if "FAILED" in summary.group(1) else 0)

@echo off
rem Starts the project on a fixed address: http://localhost:5173 (no browser caching)
cd /d "%~dp0"
start "" "http://localhost:5173"
python tools\serve.py 5173

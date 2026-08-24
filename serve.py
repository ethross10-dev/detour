#!/usr/bin/env python3
"""Detour dev server.

    python3 serve.py            -> http://localhost:8777
    python3 serve.py 9000       -> http://localhost:9000

Serves this folder on every network interface so your phone can reach it on the
same Wi-Fi. Note: iOS will only *install* the app (offline, home-screen icon)
from https:// or localhost — see README for the two ways to get that.
"""
import http.server, socketserver, socket, sys, os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".webmanifest": "application/manifest+json",
                      ".js": "text/javascript", ".json": "application/json"}
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a):
        pass

def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80)); return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), H) as httpd:
    print("\n  Detour is running.\n")
    print(f"    This Mac : http://localhost:{PORT}")
    print(f"    Phone    : http://{lan_ip()}:{PORT}   (same Wi-Fi)\n")
    print("  Ctrl-C to stop.\n")
    httpd.serve_forever()

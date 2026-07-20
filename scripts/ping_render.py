#!/usr/bin/env python3
"""
CoLLM Keep-Alive Pinger v2
Pings both Render services to prevent free-tier sleep (spins down after 15 min).

Usage:
  python scripts/ping_render.py                  # single ping
  python scripts/ping_render.py --loop 600       # ping every 10 min forever
  python scripts/ping_render.py --check          # detailed health check

Crontab (every 10 min):
  */10 * * * * cd /path/to/collm && python3 scripts/ping_render.py >> logs/ping.log 2>&1

GitHub Actions: see .github/workflows/keep-alive.yml (already configured)
"""

import sys, time, logging, argparse
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("collm-ping")

# ── Your Render URLs ────────────────────────────────────────────────
BACKEND  = "https://collm-backend.onrender.com"
FRONTEND = "https://collm-frontend.onrender.com"

ENDPOINTS = [
    (BACKEND  + "/ping",   "Backend /ping",   3),    # must be fastest
    (BACKEND  + "/health", "Backend /health", 5),
    (BACKEND  + "/wake",   "Backend /wake",   8),
    (FRONTEND,             "Frontend",        10),
]

# ────────────────────────────────────────────────────────────────────

def fetch(url: str, timeout: int = 10) -> tuple[int, float, str]:
    """Return (status_code, latency_ms, body_snippet)"""
    req = Request(url, headers={"User-Agent": "CoLLM-Pinger/2.0"})
    t0  = time.perf_counter()
    try:
        with urlopen(req, timeout=timeout) as r:
            body  = r.read(256).decode("utf-8", errors="replace")
            lat   = (time.perf_counter() - t0) * 1000
            return r.status, lat, body
    except HTTPError as e:
        lat = (time.perf_counter() - t0) * 1000
        return e.code, lat, str(e)
    except URLError as e:
        lat = (time.perf_counter() - t0) * 1000
        return 0, lat, str(e.reason)
    except Exception as e:
        lat = (time.perf_counter() - t0) * 1000
        return -1, lat, str(e)


def ping_all(verbose: bool = False) -> dict[str, bool]:
    results = {}
    log.info("━" * 52)
    log.info(f"CoLLM Ping  ·  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    log.info("━" * 52)

    for url, label, timeout in ENDPOINTS:
        status, lat, body = fetch(url, timeout)
        ok = 200 <= status < 300
        icon = "✅" if ok else ("⏳" if status == 0 else "❌")
        log.info(f"{icon}  {label:<22} {status}  {lat:>6.0f}ms")
        if verbose and body:
            log.info(f"   ↳ {body[:120]}")
        results[label] = ok

    total = len(results)
    alive = sum(results.values())
    log.info("━" * 52)
    log.info(f"{'🎉 All alive' if alive==total else f'⚠️  {alive}/{total} services alive'}")
    log.info("━" * 52)
    return results


def loop_ping(interval_seconds: int = 600):
    log.info(f"Starting loop ping every {interval_seconds}s. Ctrl+C to stop.")
    while True:
        ping_all()
        log.info(f"Next ping in {interval_seconds}s …\n")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="CoLLM keep-alive pinger")
    p.add_argument("--loop", type=int, metavar="SEC",
                   help="Run in loop every SEC seconds (e.g. --loop 600)")
    p.add_argument("--check", action="store_true",
                   help="Verbose health check with response body")
    args = p.parse_args()

    if args.loop:
        loop_ping(args.loop)
    else:
        results = ping_all(verbose=args.check)
        sys.exit(0 if all(results.values()) else 1)

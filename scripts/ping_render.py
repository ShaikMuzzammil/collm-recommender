#!/usr/bin/env python3
"""
Self-ping script to keep Render free tier services awake
Run this as a cron job or GitHub Action every 10 minutes

Usage:
    python ping_render.py

Or add to crontab (Linux/Mac):
    */10 * * * * cd /path/to/project && python3 ping_render.py >> ping.log 2>&1
"""

import requests
import time
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# UPDATE THESE WITH YOUR ACTUAL RENDER URLS
BACKEND_URL = "https://collm-backend.onrender.com"
FRONTEND_URL = "https://collm-frontend.onrender.com"

def ping_service(url, name):
    """Ping a service to keep it awake"""
    try:
        start = time.time()
        response = requests.get(url, timeout=30)
        latency = (time.time() - start) * 1000

        if response.status_code == 200:
            logger.info(f"✅ {name} is alive - {latency:.0f}ms")
            return True
        else:
            logger.warning(f"⚠️ {name} returned status {response.status_code}")
            return False

    except requests.exceptions.Timeout:
        logger.error(f"❌ {name} ping timed out")
        return False
    except Exception as e:
        logger.error(f"❌ {name} ping failed: {str(e)}")
        return False

def main():
    """Main ping loop"""
    logger.info("=" * 50)
    logger.info(f"🔔 CoLLM Self-Ping started at {datetime.now()}")
    logger.info("=" * 50)

    # Ping both services
    backend_ok = ping_service(f"{BACKEND_URL}/health", "Backend")
    frontend_ok = ping_service(FRONTEND_URL, "Frontend")

    if backend_ok and frontend_ok:
        logger.info("🎉 All services are running smoothly!")
    elif backend_ok:
        logger.warning("⚠️ Backend OK, Frontend may be sleeping")
    elif frontend_ok:
        logger.warning("⚠️ Frontend OK, Backend may be sleeping")
    else:
        logger.error("❌ Both services are down!")

    logger.info("=" * 50)

if __name__ == "__main__":
    main()

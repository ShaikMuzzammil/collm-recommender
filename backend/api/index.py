import sys, os
# Add backend root to path so `from main import app` resolves correctly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from mangum import Mangum

# lifespan="off" is required for Vercel — no persistent startup/shutdown
handler = Mangum(app, lifespan="off")

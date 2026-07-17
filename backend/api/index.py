# Vercel serverless entry point — wraps FastAPI with Mangum
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app
from mangum import Mangum

handler = Mangum(app, lifespan="off")

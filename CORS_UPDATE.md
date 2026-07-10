# Update in backend/main.py - CORS middleware for Render deployment

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Local development
        "http://localhost:8000",           # Local backend
        "https://collm-frontend.onrender.com",  # Render frontend
        "https://collm-demo.vercel.app",        # Vercel (if used)
        "https://your-custom-domain.com",        # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="TinySleuth — Checkout Truth Auditor API",
    version="1.0.0",
    description="Evidence-based pricing inspection engine powered by TinyFish AI Web Agent.",
)

# Flexible & secure CORS configuration for production and local environments
configured_origins = [o.strip() for o in settings.frontend_origin.split(",") if o.strip()]
origins = list(
    set(
        [
            *configured_origins,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:8000",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|https://.*\.netlify\.app|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Support both /api/* and root /* endpoints
app.include_router(router, prefix="/api", tags=["API"])
app.include_router(router, tags=["Root"])

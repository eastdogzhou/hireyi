"""FastAPI application entry point."""

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Initialize settings
settings = get_settings()

# Create FastAPI application
app = FastAPI(
    title="AI Resume Scanning System",
    description="AI-powered resume management and intelligent candidate-position matching",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS enabled for origins: {settings.cors_origins}")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all uncaught exceptions globally.

    :param request: FastAPI request object
    :param exc: Exception that was raised
    :return: JSON error response
    """
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "path": str(request.url),
            "method": request.method,
        },
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.environment == "development" else "An error occurred",
            "path": str(request.url),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint.

    Returns system health status including database connectivity.

    :return: Health status information
    """
    from app.config.database import get_supabase

    health_status = {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Check database connectivity
    try:
        supabase = get_supabase()
        # Simple query to verify connection
        result = supabase.table("users").select("count").limit(1).execute()
        health_status["database"] = "connected"
        logger.debug("Database health check: connected")
    except Exception as e:
        health_status["database"] = "disconnected"
        health_status["database_error"] = str(e)
        logger.error(f"Database health check failed: {e}")

    return health_status


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint with API information.

    :return: API welcome message and links
    """
    return {
        "message": "AI Resume Scanning System API",
        "version": "0.1.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


# Include API routers
from app.api import candidates, interview_feedbacks, positions, users

app.include_router(candidates.router)
app.include_router(positions.router)
app.include_router(interview_feedbacks.router)
app.include_router(users.router)


# Application startup event
@app.on_event("startup")
async def startup_event() -> None:
    """Execute on application startup.

    Performs initialization tasks like logging configuration check.
    """
    logger.info("Starting AI Resume Scanning System API")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Supabase URL: {settings.supabase_url}")
    logger.info("Application startup complete")


# Application shutdown event
@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Execute on application shutdown.

    Performs cleanup tasks.
    """
    logger.info("Shutting down AI Resume Scanning System API")

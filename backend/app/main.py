from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, get_db
from app.services.seed_data import seed_database
from app.api.endpoints import incidents, resources, routes, map, reports, assessment

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed sample demo data on startup if database is empty
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ReliefFlow AI: AI-Assisted Disaster Assessment and Relief Planning System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incidents"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["Resources & Inventory"])
app.include_router(routes.router, prefix=f"{settings.API_V1_STR}/routes", tags=["Route Planning"])
app.include_router(map.router, prefix=f"{settings.API_V1_STR}/map", tags=["Disaster Map"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Analytics"])
app.include_router(assessment.router, prefix=f"{settings.API_V1_STR}/assessment", tags=["Danger Assessment"])

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "prototype_notice": settings.DISCLAIMER,
        "docs": "/docs",
    }

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating API and database connectivity."""
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "system": settings.PROJECT_NAME,
        "is_prototype": settings.IS_PROTOTYPE,
    }

@app.post(f"{settings.API_V1_STR}/seed")
def seed_demo_data(force: bool = False, db: Session = Depends(get_db)):
    """Reseeds the database with repeatable demo disaster response records."""
    return seed_database(db, force=force)

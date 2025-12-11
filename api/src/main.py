from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.middleware.cors import CORSMiddleware
from src.routers import realm
from src.routers import compliance
from src.routers import org_manager
from src.routers import templates
from src.routers import campaign
from src.routers import tracking
from src.core.db import init_db
from src.core.mongo import close_mongo_client
from src.core.security import valid_resource_access
from src.tasks import start_scheduler, shutdown_scheduler

from jwt import PyJWKClient
import jwt
from typing import Annotated


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    try:
        start_scheduler()
        yield
    finally:
        await close_mongo_client()
    shutdown_scheduler()


app = FastAPI(
    title="Project Template API",
    summary="API to serve Project Template.",
    openapi_url="/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.get("/health", tags=["Health"], dependencies=[Depends(valid_access_token("User"))])
# async def health_check():
#     return {"status": "ok"}


@app.get(
    "/health",
    tags=["Health"],
    dependencies=[Depends(valid_resource_access("Health Check Endpoint"))],
)
async def health_check():
    return {"status": "ok"}


# Include routers
app.include_router(realm.router, prefix="/api", tags=["realms"])
app.include_router(compliance.router, prefix="/api", tags=["compliance"])
app.include_router(org_manager.router, prefix="/api/org-manager", tags=["org-manager"])
app.include_router(campaign.router, prefix="/api", tags=["campaigns"])
app.include_router(tracking.router, prefix="/api", tags=["tracking"])
app.include_router(templates.router, prefix="/api", tags=["templates"])

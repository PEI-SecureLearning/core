from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.middleware.cors import CORSMiddleware
from src.routers import (
    realm,
    compliance,
    org_manager,
    campaign,
    tracking,
    templates,
    sending_profile
)
from src.core.db import init_db
from src.core.mongo import close_mongo_client
from src.core.security import valid_resource_access
from src.tasks import start_scheduler, shutdown_scheduler
import os
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
    allow_origins=[os.getenv("WEB_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/health",
    tags=["Health"],
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
app.include_router(sending_profile.router, prefix="/api", tags=["sending-profiles"])

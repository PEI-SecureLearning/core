from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.middleware.cors import CORSMiddleware
from src.routers import (
    realm,
    compliance,
    org_manager,
    campaign,
    tracking,
    sending_profile,
)
from src.core.db import init_db
from src.core.security import valid_resource_access
from src.tasks import start_scheduler, shutdown_scheduler
import csv
import codecs

from jwt import PyJWKClient
import jwt
from typing import Annotated


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    yield
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


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    csvReader = csv.DictReader(codecs.iterdecode(file.file, "utf-8"))
    data = []
    for rows in csvReader:
        data.append(rows)
    file.file.close()
    return data


# Include routers
app.include_router(realm.router, prefix="/api", tags=["realms"])
app.include_router(compliance.router, prefix="/api", tags=["compliance"])
app.include_router(org_manager.router, prefix="/api/org-manager", tags=["org-manager"])
app.include_router(campaign.router, prefix="/api", tags=["campaigns"])
app.include_router(tracking.router, prefix="/api", tags=["tracking"])
app.include_router(sending_profile.router, prefix="/api", tags=["sending-profiles"])

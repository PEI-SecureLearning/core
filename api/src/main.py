from contextlib import asynccontextmanager
from fastapi import FastAPI,File,UploadFile
from fastapi.middleware.cors import CORSMiddleware
from src.core.db import init_db
from src.routers import product
import csv
import codecs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: Add cleanup code here if needed


app = FastAPI(
    title="Project Template API",
    summary="API to serve Project Template.",
    openapi_url="/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    csvReader = csv.DictReader(codecs.iterdecode(file.file, 'utf-8'))
    data = []  # Changed from {} to []
    for rows in csvReader:             
        data.append(rows)  # Changed from data[key] = rows
    file.file.close()
    return data

# Include routers
app.include_router(product.router,prefix="/api/products", tags=["products"])


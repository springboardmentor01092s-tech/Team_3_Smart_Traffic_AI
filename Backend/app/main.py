from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import auth, activity

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Traffic Management System API"
)

# Register routers
app.include_router(auth.router)
app.include_router(activity.router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Home Route
@app.get("/")
def home():
    return {
        "message": "Traffic Management System API"
    }
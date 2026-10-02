from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI(
    title = "Virtual Clinic API",
    description = "API para el sistema de gestión de la clínica virtual",
    version = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
    prefix="/api"
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API funcionando correctamente",
        "service": "virtual-clinic-api"
    }
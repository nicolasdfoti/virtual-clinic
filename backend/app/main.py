from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth


settings = get_settings()

app = FastAPI(
    title="Clínica Virtual API",
    description="API para el sistema de gestión de la clínica virtual",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router,
    prefix="/api",
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API funcionando correctamente",
        "service": "clinica-virtual-api",
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import admin, auth, doctor, patients, public


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
    # Lo que el frontend realmente usa (services/api.ts): get/post/put/delete.
    # Menos superficie que "*": si el frontend necesita otro metodo/header hay
    # que tocar esta lista a proposito.
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(
    auth.router,
    prefix="/api",
)

app.include_router(
    patients.router,
    prefix="/api",
)

app.include_router(
    admin.router,
    prefix="/api",
)

app.include_router(
    doctor.router,
    prefix="/api",
)

app.include_router(
    public.router,
    prefix="/api",
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API funcionando correctamente",
        "service": "clinica-virtual-api",
    }
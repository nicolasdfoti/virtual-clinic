from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import (
    admin,
    admin_appointments,
    admin_prescriptions,
    appointments,
    appointments_actions,
    auth,
    doctor,
    doctor_availability,
    doctor_time_off,
    patient_prescriptions,
    patients,
    public,
    slots,
)


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
    slots.router,
    prefix="/api",
)

app.include_router(
    appointments.router,
    prefix="/api",
)

app.include_router(
    appointments_actions.router,
    prefix="/api",
)

app.include_router(
    doctor_availability.router,
    prefix="/api",
)

app.include_router(
    doctor_time_off.router,
    prefix="/api",
)

app.include_router(
    admin_appointments.router,
    prefix="/api",
)

app.include_router(
    admin_prescriptions.router,
    prefix="/api",
)

app.include_router(
    patient_prescriptions.router,
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
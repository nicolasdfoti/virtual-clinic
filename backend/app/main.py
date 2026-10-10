from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.middleware.rate_limit_middleware import LoginEmailExtractorMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.origin_check import OriginCheckMiddleware
from app.routers import (
    admin,
    admin_appointments,
    admin_prescriptions,
    appointments,
    appointments_actions,
    auth,
    doctor,
    doctor_availability,
    doctor_clinical_notes,
    doctor_patient_files,
    doctor_time_off,
    patient_clinical_notes,
    patient_files,
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

# Rate limiting middleware (debe ir antes de CORS para que el limiter vea la IP real)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Middleware para extraer email en login/register
app.add_middleware(LoginEmailExtractorMiddleware)

# Security headers (CSP, HSTS, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# Origin check para requests mutantes
app.add_middleware(OriginCheckMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


# Handler para rate limit exceeded
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes. Intente más tarde."},
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
    doctor_clinical_notes.router,
    prefix="/api",
)

app.include_router(
    doctor_patient_files.router,
    prefix="/api",
)

app.include_router(
    patient_clinical_notes.router,
    prefix="/api",
)

app.include_router(
    patient_files.router,
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
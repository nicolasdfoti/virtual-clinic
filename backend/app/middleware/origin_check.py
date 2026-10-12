"""Middleware para validar Origin en requests que mutan estado.

En produccion, solo acepta requests con Origin en la lista de CORS_ORIGINS.
En desarrollo, es mas permisivo pero loguea warnings.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings


settings = get_settings()

# Metodos que mutan estado
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class OriginCheckMiddleware(BaseHTTPMiddleware):
    """Valida el header Origin en requests mutantes.

    En produccion, rechaza requests sin Origin o con Origin no permitido.
    En desarrollo, solo loguea warning si Origin no esta en CORS_ORIGINS.
    """

    async def dispatch(self, request: Request, call_next):
        if request.method in MUTATING_METHODS:
            origin = request.headers.get("origin")

            if origin:
                # Normalizar ambos lados (quitar trailing slash).
                origin_norm = origin.rstrip("/")
                allowed_origins = {
                    candidate.rstrip("/") for candidate in settings.CORS_ORIGINS
                }

                if origin_norm not in allowed_origins:
                    if settings.ENVIRONMENT == "production":
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Origen no permitido."},
                        )

                    # En desarrollo logueamos pero dejamos pasar para no
                    # bloquear herramientas locales (curl, Swagger, etc.).
                    import logging

                    logging.warning(f"Origin no permitido en desarrollo: {origin}")
            elif settings.ENVIRONMENT == "production":
                # Con SameSite=None la cookie viaja cross-site, asi que el
                # Origin pasa a ser la unica barrera CSRF: en produccion no
                # aceptamos requests mutantes sin Origin. Ningun cliente
                # legitimo (SPA en el navegador) muta estado sin mandarlo.
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Falta el encabezado Origin."},
                )

        return await call_next(request)
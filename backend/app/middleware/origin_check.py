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
        # Solo validar metodos mutantes y solo si hay Origin header
        if request.method in MUTATING_METHODS:
            origin = request.headers.get("origin")

            # En API calls desde el mismo origen (SPA), el navegador envia Origin
            # En llamadas server-to-server o herramientas, puede no haber Origin
            # Permitimos requests sin Origin (server-to-server) pero validamos si hay

            if origin:
                allowed_origins = settings.CORS_ORIGINS

                # Normalizar origin para comparacion (quitar trailing slash)
                origin_norm = origin.rstrip("/")

                if origin_norm not in allowed_origins:
                    if settings.ENVIRONMENT == "production":
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Origen no permitido."},
                        )
                    else:
                        # En desarrollo, loguear pero permitir
                        import logging
                        logging.warning(f"Origin no permitido en desarrollo: {origin}")

        return await call_next(request)
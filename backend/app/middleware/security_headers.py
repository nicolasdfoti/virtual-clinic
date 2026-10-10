"""Middleware de headers de seguridad para producción.

Agrega:
- Content-Security-Policy (CSP): restringe fuentes de scripts, estilos, imagenes, etc.
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS): solo en produccion con HTTPS
- Permissions-Policy: restringe APIs del navegador
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings


settings = get_settings()

# CSP para el frontend (Vite + React). Ajustar si hay fuentes externas.
# En desarrollo, Vite usa websocket/HMR; en produccion solo assets estaticos.
CSP_DEVELOPMENT = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; "
    "style-src 'self' 'unsafe-inline' https:; "
    "img-src 'self' data: https:; "
    "font-src 'self' https: data:; "
    "connect-src 'self' https: wss:; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)

CSP_PRODUCTION = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega headers de seguridad a todas las respuestas."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # CSP
        csp = CSP_PRODUCTION if settings.ENVIRONMENT == "production" else CSP_DEVELOPMENT
        response.headers["Content-Security-Policy"] = csp

        # Prevenir MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Prevenir clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # HSTS solo en produccion con HTTPS
        if settings.ENVIRONMENT == "production" and settings.COOKIE_SECURE:
            # max-age=1 year, include subdomains, preload
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Permissions Policy (antes Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        # Cache control para endpoints de salud y estaticos
        if request.url.path in ("/api/health",):
            response.headers["Cache-Control"] = "no-store, max-age=0"

        return response


def add_security_headers_middleware(app):
    """Helper para agregar el middleware al app."""
    app.add_middleware(SecurityHeadersMiddleware)
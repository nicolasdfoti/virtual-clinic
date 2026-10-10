"""Middleware para extraer email del body en login/register y guardarlo en request.state
para que el rate limiter pueda usarlo como parte de la key (IP + email)."""
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LoginEmailExtractorMiddleware(BaseHTTPMiddleware):
    """Extrae email del body JSON en /auth/login y /auth/register.

    Lo guarda en request.state.login_email para que el rate limiter
    pueda usar IP + email como key.
    """

    async def dispatch(self, request: Request, call_next):
        # Solo nos interesan POST a /auth/login y /auth/register
        if request.method == "POST" and request.url.path in ("/api/auth/login", "/api/auth/register"):
            try:
                body = await request.body()
                if body:
                    data = json.loads(body.decode())
                    email = data.get("email", "").strip().lower()
                    if email:
                        request.state.login_email = email
            except Exception:
                # Si falla el parsing, seguimos sin email (rate limit solo por IP)
                pass

            # Reconstruir el request con el body para que el endpoint pueda leerlo
            async def receive():
                return {"type": "http.request", "body": body}

            request._receive = receive

        return await call_next(request)


class UserIdExtractorMiddleware(BaseHTTPMiddleware):
    """Extrae user_id del usuario autenticado y lo guarda en request.state
    para rate limiting en endpoints autenticados (subida archivos, etc.)."""

    async def dispatch(self, request: Request, call_next):
        # El user_id se puede obtener del token JWT en el cookie
        # Pero como la autenticacion ocurre via dependencias, usamos un enfoque
        # diferente: el endpoint setea request.state.user_id despues de autenticar.
        return await call_next(request)
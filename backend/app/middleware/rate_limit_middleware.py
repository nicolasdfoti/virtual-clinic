"""Middleware para extraer email del body en login/register y guardarlo en request.state
para que el rate limiter pueda usarlo como parte de la key (IP + email)."""
import json

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import ACCESS_TOKEN_COOKIE_NAME
from app.core.security import decode_access_token


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
    """Extrae el user_id del JWT de la cookie y lo guarda en request.state.

    Lo usa `get_ip_userid_key` para rate-limitar por usuario en endpoints
    autenticados (subida de archivos). Es best-effort: si no hay cookie o el
    token es invalido, se sigue sin user_id (la key cae a solo-IP).
    """

    async def dispatch(self, request: Request, call_next):
        token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)

        if token:
            payload = decode_access_token(token)

            if payload is not None:
                request.state.user_id = payload.subject

        return await call_next(request)
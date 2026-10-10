"""Rate limiting configuration using slowapi.

Define limiters para endpoints criticos:
- login/register: por IP + email (evita brute force y enum. de cuentas)
- password reset/change: por IP + user_id
- contacto: por IP
- subida de archivos: por IP + user_id
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import get_settings


settings = get_settings()

# Limiter global: usa IP del cliente (detras de proxy si hay X-Forwarded-For)
# En testing desactivamos el rate limiting completamente.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=settings.RATE_LIMIT_STORAGE_URI if hasattr(settings, 'RATE_LIMIT_STORAGE_URI') else "memory://",
    enabled=settings.ENVIRONMENT != "testing",
)


def get_ip_email_key(request: Request) -> str:
    """Key para login/register: IP + email normalizado (lowercase).
    El email viene en el body JSON; si no hay body, usa solo IP.
    """
    ip = get_remote_address(request)
    email = ""

    # Intentar leer email del body (cacheado en request.state por middleware)
    if hasattr(request.state, "login_email"):
        email = request.state.login_email.lower()

    return f"{ip}:{email}" if email else ip


def get_ip_userid_key(request: Request) -> str:
    """Key para endpoints autenticados: IP + user_id.
    Requiere que el usuario ya este autenticado (dependencia get_current_user).
    """
    ip = get_remote_address(request)
    user_id = ""

    if hasattr(request.state, "user_id"):
        user_id = str(request.state.user_id)

    return f"{ip}:{user_id}" if user_id else ip


# Limiters especificos por endpoint
login_limiter = limiter.limit("5/minute", key_func=get_ip_email_key)
register_limiter = limiter.limit("3/minute", key_func=get_ip_email_key)
password_reset_limiter = limiter.limit("2/hour", key_func=get_ip_email_key)
contact_limiter = limiter.limit("10/hour", key_func=get_remote_address)
upload_limiter = limiter.limit("20/hour", key_func=get_ip_userid_key)
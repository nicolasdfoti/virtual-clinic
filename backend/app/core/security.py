from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import ALGORITHM, get_settings


@dataclass(frozen=True)
class TokenPayload:
    """Contenido util del JWT. `version` es la de `users.token_version`: si no
    coincide con la actual, el token quedo revocado (logout global o cambio de
    contraseña)."""

    subject: str
    version: int


settings = get_settings()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    subject: str,
    token_version: int = 0,
    expires_minutes: int | None = None,
) -> str:
    minutes = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES
        if expires_minutes is None
        else expires_minutes
    )

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)

    return jwt.encode(
        {"sub": subject, "ver": token_version, "exp": expires_at},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )
    except JWTError:
        return None

    subject = payload.get("sub")

    if not isinstance(subject, str) or not subject.isdigit():
        return None

    # Los tokens viejos (emitidos antes de existir `ver`) valen como version 0.
    version = payload.get("ver", 0)

    if not isinstance(version, int) or isinstance(version, bool):
        return None

    return TokenPayload(subject=subject, version=version)
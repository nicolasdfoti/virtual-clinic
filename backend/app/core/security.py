"""Seguridad: hashing de contraseñas (argon2id via pwdlib) y JWT (PyJWT)."""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers import argon2, bcrypt

from app.core.config import ALGORITHM, get_settings


@dataclass(frozen=True)
class TokenPayload:
    """Contenido util del JWT. `version` es la de `users.token_version`: si no
    coincide con la actual, el token quedo revocado (logout global o cambio de
    contrasena)."""

    subject: str
    version: int


settings = get_settings()

# pwdlib usa argon2id por defecto con parametros seguros.
# Configuramos los hashers: argon2id como principal, bcrypt para compatibilidad
# con hashes legacy (rehashing transparente al login).
_pwd_hash = PasswordHash([argon2.Argon2Hasher(), bcrypt.BcryptHasher()])


def hash_password(password: str) -> str:
    """Hashea una contrasena con argon2id (via pwdlib)."""
    return _pwd_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contrasena contra su hash (argon2id o bcrypt legacy)."""
    try:
        return _pwd_hash.verify(plain_password, hashed_password)
    except Exception:
        # Cualquier error de verificacion (hash corrupto, algoritmo desconocido,
        # etc.) se trata como fallo de autenticacion.
        return False


def create_access_token(
    subject: str,
    token_version: int = 0,
    expires_minutes: Optional[int] = None,
) -> str:
    """Crea un JWT firmado con HS256 (PyJWT)."""
    minutes = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES
        if expires_minutes is None
        else expires_minutes
    )

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)

    payload = {
        "sub": subject,
        "ver": token_version,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> Optional[TokenPayload]:
    """Decodifica y valida un JWT. Devuelve None si es invalido o expirado."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "iat", "sub", "ver"]},
        )
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")

    if not isinstance(subject, str) or not subject.isdigit():
        return None

    version = payload.get("ver")

    if not isinstance(version, int) or isinstance(version, bool):
        return None

    return TokenPayload(subject=subject, version=version)


def rehash_password_if_needed(hashed_password: str, plain_password: str) -> Optional[str]:
    """
    Si el hash no es argon2id (p.ej. legacy bcrypt), lo rehashea transparente
    al hacer login. Devuelve el nuevo hash o None si ya es argon2id.
    """
    # pwdlib detecta el algoritmo por el prefijo del hash ($argon2id$, $bcrypt$, etc.)
    # Si verify() pasa pero el hash no empieza con $argon2id$, rehasheamos.
    try:
        if _pwd_hash.verify(plain_password, hashed_password):
            if not hashed_password.startswith("$argon2id$"):
                return hash_password(plain_password)
    except Exception:
        pass
    return None
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import ACCESS_TOKEN_COOKIE_NAME
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User


CREDENTIALS_HEADERS = {"WWW-Authenticate": "Bearer"}

INVALID_SESSION_DETAIL = "Sesión inválida o expirada."


def get_current_user(
    access_token: str | None = Cookie(
        default=None,
        alias=ACCESS_TOKEN_COOKIE_NAME,
    ),
    db: Session = Depends(get_db),
) -> User:
    """Usuario autenticado, sea activo o no.

    Separado de `get_current_active_user` a proposito: "no existe o el token
    no es valido" es un 401 (el cliente debe re-loguearse), mientras que
    "existe pero esta desactivado" es un 403 (el cliente esta bien autenticado
    y hay que mostrarle el motivo).
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_SESSION_DETAIL,
            headers=CREDENTIALS_HEADERS,
        )

    user_id = decode_access_token(access_token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_SESSION_DETAIL,
            headers=CREDENTIALS_HEADERS,
        )

    user = db.get(User, int(user_id))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_SESSION_DETAIL,
            headers=CREDENTIALS_HEADERS,
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está desactivada.",
        )

    return current_user
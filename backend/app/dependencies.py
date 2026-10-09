from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import ACCESS_TOKEN_COOKIE_NAME
from app.core.security import decode_access_token
from app.database import get_db
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.user import User


CREDENTIALS_HEADERS = {"WWW-Authenticate": "Bearer"}

INVALID_SESSION_DETAIL = "Sesión inválida o expirada."

ROLE_FORBIDDEN_DETAIL = "No tenés permisos para esta acción."


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

    token = decode_access_token(access_token)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_SESSION_DETAIL,
            headers=CREDENTIALS_HEADERS,
        )

    user = db.get(User, int(token.subject))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_SESSION_DETAIL,
            headers=CREDENTIALS_HEADERS,
        )

    # Token revocado: el usuario cambio la contraseña (o se cerro sesion en
    # todos los dispositivos) despues de que se emitiera.
    if user.token_version != token.version:
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


def require_roles(*roles: Role):
    """Factory de dependencia que exige que el usuario este autenticado y
    activo y tenga alguno de `roles`.

    Se usa como `Depends(require_roles(Role.DOCTOR, Role.ADMIN))`. Un rol que
    no paga el corte es un 403: el recurso existe, el usuario no puede (la
    pertenencia del recurso ajeno es otra cosa y se maneja con 404 en cada
    endpoint).
    """

    def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ROLE_FORBIDDEN_DETAIL,
            )

        return current_user

    return check_role


def get_current_doctor(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Doctor:
    """Doctor detras del usuario autenticado, si lo hay.

    Exige que el `doctors` este activo. Vale para DOCTOR y tambien para ADMIN
    con fila de doctor (el rol se ignora a proposito: la fila es el dato que
    importa). Sin fila o inactiva = 403, no 404: no es un recurso ajeno, es un
    permiso que el usuario no tiene.
    """
    doctor = (
        db.query(Doctor)
        .filter(Doctor.user_id == current_user.id)
        .first()
    )

    if doctor is None or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu perfil de médico no está activo.",
        )

    return doctor
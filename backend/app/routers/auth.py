from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import (
    ACCESS_TOKEN_COOKIE_NAME,
    ACCESS_TOKEN_COOKIE_PATH,
    ACCESS_TOKEN_COOKIE_SAMESITE,
    get_settings,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies import get_current_active_user
from app.database import get_db
from app.models.enums import Role
from app.models.user import User
from app.schemas.user import (
    LoginRequest,
    UserCreate,
    UserResponse,
    normalize_email,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

settings = get_settings()

CREDENTIALS_HEADERS = {"WWW-Authenticate": "Bearer"}

GENERIC_LOGIN_ERROR = "Credenciales inválidas."

# Se hashea una sola vez al importar para que el login de un email inexistente
# tarde lo mismo que uno real: sin esto, el 401 "rápido" delata que el email no
# esta registrado (timing attack de enumeracion de cuentas).
DUMMY_PASSWORD_HASH = hash_password("password-not-a-real-user")


def set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=ACCESS_TOKEN_COOKIE_SAMESITE,
        path=ACCESS_TOKEN_COOKIE_PATH,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=ACCESS_TOKEN_COOKIE_SAMESITE,
        path=ACCESS_TOKEN_COOKIE_PATH,
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo completar el registro.",
        )

    new_user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=Role.PATIENT,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=UserResponse,
)
def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalize_email(credentials.email)

    user = db.query(User).filter(User.email == email).first()

    password_hash = (
        user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    )

    password_matches = verify_password(credentials.password, password_hash)

    # Mismo status y mismo mensaje para "no existe" y "contrasena incorrecta":
    # distinguir los dos permitiria enumerar que emails estan registrados.
    if user is None or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_LOGIN_ERROR,
            headers=CREDENTIALS_HEADERS,
        )

    # Cuenta desactivada con la contrasena correcta. Tambien mensaje generico:
    # decir "tu cuenta esta desactivada" confirma que el email existe y que la
    # contrasena es correcta, que es justo lo que el endpoint no debe filtrar.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=GENERIC_LOGIN_ERROR,
            headers=CREDENTIALS_HEADERS,
        )

    set_auth_cookie(
        response,
        create_access_token(subject=str(user.id)),
    )

    return user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(response: Response):
    clear_auth_cookie(response)

    return None


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(get_current_active_user),
):
    return current_user
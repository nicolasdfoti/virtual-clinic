from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import (
    ACCESS_TOKEN_COOKIE_NAME,
    ACCESS_TOKEN_COOKIE_PATH,
    ACCESS_TOKEN_COOKIE_SAMESITE,
    get_settings,
)
from app.core.rate_limit import login_limiter, register_limiter
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
    rehash_password_if_needed,
)
from app.dependencies import get_current_active_user
from app.database import get_db
from app.models.enums import Role
from app.models.user import User
from app.schemas.user import (
    LoginRequest,
    PasswordChange,
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

# Hash dummy para timing attack: argon2id hash de "dummy".
# Se genera una vez al importar.
DUMMY_PASSWORD_HASH = hash_password("dummy-password-not-a-real-user")


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
@register_limiter
def register(
    request: Request,
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

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo completar el registro.",
        )

    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=UserResponse,
)
@login_limiter
def login(
    request: Request,
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
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=GENERIC_LOGIN_ERROR,
            headers=CREDENTIALS_HEADERS,
        )

    # Rehash transparente: si el usuario tenia hash legacy (bcrypt), lo
    # actualizamos a argon2id sin que el usuario lo note.
    if user is not None:
        new_hash = rehash_password_if_needed(user.password_hash, credentials.password)
        if new_hash:
            user.password_hash = new_hash
            db.commit()

    set_auth_cookie(
        response,
        create_access_token(
            subject=str(user.id),
            token_version=user.token_version,
        ),
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


@router.patch(
    "/password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def change_password(
    payload: PasswordChange,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta.",
        )

    current_user.password_hash = hash_password(payload.new_password)

    # Con esto el usuario deja de tener la clave temporal y puede usar el
    # portal normalmente.
    current_user.must_change_password = False

    # Invalida los tokens emitidos antes de este cambio (otras sesiones
    # abiertas). La sesion actual se conserva reemitiendo la cookie abajo.
    current_user.token_version += 1

    db.commit()
    db.refresh(current_user)

    set_auth_cookie(
        response,
        create_access_token(
            subject=str(current_user.id),
            token_version=current_user.token_version,
        ),
    )

    return None
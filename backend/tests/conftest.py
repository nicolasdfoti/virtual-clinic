"""Infra de tests del backend.

La URL de la base de test sale de TEST_DATABASE_URL. Si no esta definida se cae
a un SQLite en archivo, para que la suite se pueda correr sin levantar Docker.
En Windows/develop se espera exportarla apuntando a Postgres:

    TEST_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/test_db
"""
import os


# Tiene que existir un SECRET_KEY valido (>=32 chars) antes de que se importe
# app.core.config, porque Settings lo exige sin default.
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-not-used-anywhere")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("SQL_ECHO", "false")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

USING_SQLITE = TEST_DATABASE_URL is None

if USING_SQLITE:
    os.environ["DATABASE_URL"] = "sqlite://"
else:
    # Los tests borran las tablas entre casos: apuntar a la base de desarrollo
    # (o a cualquier base sin "test" en el nombre) destruiria datos reales.
    # Se aborta la corrida antes de tocar nada en vez de pedir confirmacion.
    from sqlalchemy.engine.url import make_url

    parsed = make_url(TEST_DATABASE_URL)
    database_name = parsed.database or ""

    if "test" not in database_name.lower():
        raise SystemExit(
            "TEST_DATABASE_URL debe apuntar a una base de test (nombre con "
            f"'test'), no a '{database_name}'. Abortando para no borrar datos."
        )

    # pydantic-settings prioriza las variables de entorno sobre el archivo .env,
    # asi que esto evita que la app se conecte a la base de develop.
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.user import User


if USING_SQLITE:
    # StaticPool mantiene una sola conexión: SQLite en memoria se borra al
    # cerrarla, y con el pool normal cada sesión abriría una DB nueva.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(TEST_DATABASE_URL, echo=False)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Cada test arranca con las tablas vacias.

    El orden importa: primero users porque es la referenciada por otras tablas.
    """
    yield

    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())


@pytest.fixture
def db_session():
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def create_user(
    session,
    email: str = "ana@example.com",
    password: str = "Password123",
    role: Role = Role.PATIENT,
    is_active: bool = True,
    first_name: str = "Ana",
    last_name: str = "Ruiz",
    must_change_password: bool = False,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_active=is_active,
        must_change_password=must_change_password,
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def create_doctor(
    session,
    user: User,
    license_number: str = "MP 100",
    specialty: str = "Clínica médica",
    bio: str | None = None,
    is_active: bool = True,
    consultation_minutes: int = 30,
) -> Doctor:
    """Crea la fila de doctor one-to-one para `user` y la devuelve."""
    doctor = Doctor(
        user_id=user.id,
        license_number=license_number,
        specialty=specialty,
        bio=bio,
        is_active=is_active,
        consultation_minutes=consultation_minutes,
    )

    session.add(doctor)
    session.commit()
    session.refresh(doctor)

    return doctor


@pytest.fixture
def user(db_session) -> User:
    return create_user(db_session)


@pytest.fixture
def inactive_user(db_session) -> User:
    return create_user(
        db_session,
        email="inactivo@example.com",
        is_active=False,
    )


@pytest.fixture
def doctor_user(db_session) -> User:
    """Usuario con rol DOCTOR y su fila de doctor activa."""
    doctor_user = create_user(
        db_session,
        email="medico@example.com",
        role=Role.DOCTOR,
    )
    create_doctor(db_session, doctor_user, license_number="MP 100")

    return doctor_user


@pytest.fixture
def admin_user(db_session) -> User:
    return create_user(
        db_session,
        email="admin@example.com",
        role=Role.ADMIN,
    )


@pytest.fixture
def settings():
    return get_settings()
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import get_settings


settings = get_settings()


def normalize_database_url(url: str) -> str:
    """Fuerza el driver psycopg (SQLAlchemy 2) sobre la URL que da el hosting.

    Render/Heroku entregan `postgres://...` o `postgresql://...`, que SQLAlchemy
    mapearia a psycopg2 (no instalado). Con `postgresql+psycopg://` usamos
    psycopg 3, que es el que esta en requirements.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]

    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]

    return url


DATABASE_URL = normalize_database_url(settings.DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    echo=settings.SQL_ECHO,
    # Revalida la conexion antes de usarla: Postgres cierra conexiones
    # inactivas (postgres_cleanup_timeout / reinicios del pool) y sin esto una
    # conexion muerta reventaba el primer query del dia con `Lost connection`.
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
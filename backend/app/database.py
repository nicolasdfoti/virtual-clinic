from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import get_settings


settings = get_settings()

DATABASE_URL = settings.DATABASE_URL

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
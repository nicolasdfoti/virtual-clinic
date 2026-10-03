"""Modelos de la aplicacion.

Este import no es decorativo: SQLAlchemy registra una tabla en
`Base.metadata` en el momento en que se importa su clase. Con este archivo
vacio, `import app.models` no registraba nada y `Base.metadata.create_all()`
creaba cero tablas sin fallar, igual que `alembic --autogenerate` no detectaba
cambios.

Importar los modelos aca es la forma de que quien use `Base.metadata` no tenga
que acordarse de importar cada modulo a mano.
"""
from app.models.doctor import Doctor
from app.models.enums import Role
from app.models.user import User

__all__ = ["Doctor", "Role", "User"]
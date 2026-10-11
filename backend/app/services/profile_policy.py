"""Politica de visibilidad de perfiles.

Reglas:
- Todo usuario ve su propio perfil.
- PATIENT solo ve perfiles de medicos (ADMIN y otros pacientes -> 404).
- DOCTOR y ADMIN ven todos los perfiles.
"""

from app.models.enums import Role
from app.models.user import User


def can_view(viewer: User, target: User) -> bool:
    """Determina si `viewer` puede ver el perfil de `target`.

    Args:
        viewer: Usuario que intenta ver el perfil.
        target: Usuario dueño del perfil.

    Returns:
        True si el viewer puede ver el perfil, False en caso contrario.
    """
    # Propio perfil: siempre visible
    if viewer.id == target.id:
        return True

    # Segun rol del viewer
    if viewer.role == Role.PATIENT:
        # Pacientes solo ven medicos
        return target.role == Role.DOCTOR

    # DOCTOR y ADMIN ven todos
    if viewer.role in (Role.DOCTOR, Role.ADMIN):
        return True

    # Por defecto, no visible (no deberia ocurrir con los roles actuales)
    return False
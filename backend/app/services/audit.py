from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def client_ip(request: Request) -> str | None:
    """IP del cliente que origino el request, si el servidor la conoce."""
    client = getattr(request, "client", None)

    return client.host if client is not None else None


def log(
    db: Session,
    *,
    actor_user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    ip: str | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    """Registra una accion y la persiste.

    Commitea por su cuenta: varios de los eventos auditados son lecturas, que no
    tienen otra escritura que arrastre la transaccion. Nunca recibe datos de
    salud: solo identificadores, accion y contexto administrativo.
    """
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip=ip,
        extra=metadata,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry

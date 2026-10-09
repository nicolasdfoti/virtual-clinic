from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr


class AuditLogResponse(BaseModel):
    """Entrada de auditoria tal como la ve el admin.

    `metadata` (columna `metadata`, atributo `extra` en el modelo) nunca lleva
    datos de salud: solo contexto administrativo.
    """

    id: int
    actor_user_id: int | None = None
    actor_email: EmailStr | None = None
    actor_name: str | None = None
    action: str
    entity_type: str
    entity_id: int | None = None
    ip: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    limit: int
    offset: int

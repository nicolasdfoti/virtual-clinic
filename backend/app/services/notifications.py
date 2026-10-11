"""Notificaciones in-app.

Cada aviso es una fila en `notifications` para un usuario. Los textos se arman
con nombres, fechas y tipo de evento; nunca con datos de salud (motivo de
consulta, medicamentos, diagnostico), porque las notificaciones podrian
mostrarse en un dispositivo compartido.
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.models.notification import Notification
from app.models.enums import Role

CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)


def _format_when(value: datetime) -> str:
    """Fecha/hora en la zona de la clinica. Si viene naive, se asume UTC."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=ZoneInfo("UTC"))

    return value.astimezone(CLINIC_TZ).strftime("%d/%m/%Y %H:%M")


def _create(
    db: Session,
    *,
    user_id: int | None,
    type_: str,
    title: str,
    message: str,
    related_type: str | None = None,
    related_id: int | None = None,
) -> None:
    # Sin destinatario no hay aviso que crear: no se rompe el flujo principal.
    if user_id is None:
        return

    db.add(
        Notification(
            user_id=user_id,
            type=type_,
            title=title,
            message=message,
            related_type=related_type,
            related_id=related_id,
        )
    )
    db.commit()


def notify_appointment_booked(
    db: Session,
    *,
    appointment_id: int,
    doctor_user_id: int | None,
    patient_name: str | None,
    starts_at: datetime,
) -> None:
    who = patient_name or "Un paciente"
    _create(
        db,
        user_id=doctor_user_id,
        type_="appointment_booked",
        title="Nuevo turno reservado",
        message=f"{who} reservó un turno para el {_format_when(starts_at)}.",
        related_type="appointment",
        related_id=appointment_id,
    )


def notify_appointment_cancelled(
    db: Session,
    *,
    appointment_id: int,
    cancelled_by_role: Role,
    cancelled_by_name: str | None,
    doctor_user_id: int | None,
    patient_user_id: int | None,
    starts_at: datetime,
) -> None:
    who = cancelled_by_name or "La otra parte"

    if cancelled_by_role == Role.PATIENT:
        # Cancelo el paciente: se avisa al medico.
        _create(
            db,
            user_id=doctor_user_id,
            type_="appointment_cancelled",
            title="Turno cancelado",
            message=f"{who} canceló el turno del {_format_when(starts_at)}.",
            related_type="appointment",
            related_id=appointment_id,
        )
    else:
        # Cancelo el medico (o un admin): se avisa al paciente.
        _create(
            db,
            user_id=patient_user_id,
            type_="appointment_cancelled",
            title="Turno cancelado",
            message=f"Se canceló tu turno del {_format_when(starts_at)}.",
            related_type="appointment",
            related_id=appointment_id,
        )


def notify_appointment_completed(
    db: Session,
    *,
    appointment_id: int,
    patient_user_id: int | None,
    starts_at: datetime,
) -> None:
    _create(
        db,
        user_id=patient_user_id,
        type_="appointment_completed",
        title="Consulta completada",
        message=f"Tu consulta del {_format_when(starts_at)} quedó registrada.",
        related_type="appointment",
        related_id=appointment_id,
    )


def notify_appointment_no_show(
    db: Session,
    *,
    appointment_id: int,
    patient_user_id: int | None,
    starts_at: datetime,
) -> None:
    _create(
        db,
        user_id=patient_user_id,
        type_="appointment_no_show",
        title="Turno marcado como ausente",
        message=f"El turno del {_format_when(starts_at)} se marcó como ausente.",
        related_type="appointment",
        related_id=appointment_id,
    )


def notify_prescription_created(
    db: Session,
    *,
    patient_user_id: int | None,
    doctor_name: str | None,
    prescription_id: int,
) -> None:
    who = doctor_name or "Tu médico"
    _create(
        db,
        user_id=patient_user_id,
        type_="prescription_created",
        title="Nueva receta",
        message=f"{who} emitió una nueva receta. Podés verla en tu portal.",
        related_type="prescription",
        related_id=prescription_id,
    )


def notify_medical_order_created(
    db: Session,
    *,
    patient_user_id: int | None,
    doctor_name: str | None,
    order_id: int,
) -> None:
    who = doctor_name or "Tu médico"
    _create(
        db,
        user_id=patient_user_id,
        type_="medical_order_created",
        title="Nueva orden médica",
        message=f"{who} emitió una nueva orden. Podés verla en tu portal.",
        related_type="medical_order",
        related_id=order_id,
    )

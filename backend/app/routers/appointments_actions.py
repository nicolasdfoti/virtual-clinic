from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE
from app.database import get_db
from app.dependencies import get_current_doctor, get_current_ready_user
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus, Role
from app.models.user import User
from app.schemas.appointment import AppointmentCancelRequest, AppointmentUpdateResponse
from app.services import notifications

router = APIRouter(tags=["Appointments actions"])

CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)
CANCEL_HOURS_BEFORE = 24


def _is_patient_owner(appt: Appointment, user: User) -> bool:
    return appt.patient_id == user.id


def _is_doctor_owner(appt: Appointment, doctor) -> bool:
    return doctor is not None and appt.doctor_id == doctor.id


@router.patch(
    "/appointments/{appointment_id}/cancel",
    response_model=AppointmentUpdateResponse,
)
def cancel_appointment(
    appointment_id: int,
    payload: AppointmentCancelRequest,
    request: Request,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    appt = db.get(Appointment, appointment_id)

    if appt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese turno.",
        )

    doctor = None
    if current_user.role == Role.DOCTOR:
        from app.models.doctor import Doctor

        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    can_cancel = False
    if current_user.role == Role.ADMIN:
        can_cancel = True
    elif _is_doctor_owner(appt, doctor):
        can_cancel = True
    elif _is_patient_owner(appt, current_user):
        now_utc = datetime.now(ZoneInfo("UTC"))
        starts_at = appt.starts_at
        if starts_at.tzinfo is None:
            starts_at = starts_at.replace(tzinfo=ZoneInfo("UTC"))
        hours_before = (starts_at - now_utc).total_seconds() / 3600
        if hours_before >= CANCEL_HOURS_BEFORE:
            can_cancel = True

    if not can_cancel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No podés cancelar este turno en este momento.",
        )

    if appt.status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este turno ya no se puede cancelar.",
        )

    appt.status = AppointmentStatus.CANCELLED
    appt.cancelled_by = current_user.id
    appt.cancel_reason = payload.reason

    db.commit()
    db.refresh(appt)

    notifications.send(
        "appointment_cancelled",
        {"appointment_id": appt.id, "cancelled_by": current_user.id},
    )

    return AppointmentUpdateResponse(id=appt.id, status=appt.status)


@router.patch(
    "/appointments/{appointment_id}/complete",
    response_model=AppointmentUpdateResponse,
)
def complete_appointment(
    appointment_id: int,
    doctor=Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    appt = db.get(Appointment, appointment_id)

    if appt is None or appt.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese turno.",
        )

    if appt.status not in (AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este turno no puede marcarse como completado.",
        )

    appt.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(appt)

    return AppointmentUpdateResponse(id=appt.id, status=appt.status)


@router.patch(
    "/appointments/{appointment_id}/no-show",
    response_model=AppointmentUpdateResponse,
)
def no_show_appointment(
    appointment_id: int,
    doctor=Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    appt = db.get(Appointment, appointment_id)

    if appt is None or appt.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese turno.",
        )

    if appt.status not in (AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este turno no puede marcarse como ausente.",
        )

    appt.status = AppointmentStatus.NO_SHOW
    db.commit()
    db.refresh(appt)

    return AppointmentUpdateResponse(id=appt.id, status=appt.status)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.models.doctor_time_off import DoctorTimeOff
from app.schemas.time_off import DoctorTimeOffCreate, DoctorTimeOffResponse

router = APIRouter(prefix="/doctor/time-off", tags=["Doctor time-off"])


@router.get("", response_model=list[DoctorTimeOffResponse])
def list_time_off(
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DoctorTimeOff)
        .filter(DoctorTimeOff.doctor_id == doctor.id)
        .order_by(DoctorTimeOff.starts_at)
        .all()
    )

    return rows


@router.post(
    "",
    response_model=DoctorTimeOffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_time_off(
    payload: DoctorTimeOffCreate,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El fin del bloque debe ser posterior al inicio.",
        )

    row = DoctorTimeOff(
        doctor_id=doctor.id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        reason=payload.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return row

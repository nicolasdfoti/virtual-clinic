from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import MedicalOrderStatus, PrescriptionStatus, Role
from app.models.prescription import Prescription, PrescriptionItem, MedicalOrder
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient_profile import PatientProfile
from app.schemas.prescription import (
    AdminMedicalOrderListResponse,
    AdminMedicalOrderResponse,
    AdminPrescriptionListResponse,
    AdminPrescriptionResponse,
    AdminDoctorActivityResponse,
    DoctorActivityResponse,
)
from app.services import audit, pdf, prescriptions, scheduling, storage

router = APIRouter(prefix="/admin/prescriptions", tags=["Admin prescriptions"])


def _load_doctors(db: Session, doctor_ids: set[int]) -> dict[int, Doctor]:
    """Carga medicos (con su usuario) en una sola consulta."""
    if not doctor_ids:
        return {}
    rows = (
        db.query(Doctor)
        .options(joinedload(Doctor.user))
        .filter(Doctor.id.in_(doctor_ids))
        .all()
    )
    return {d.id: d for d in rows}


def _load_patients_and_profiles(
    db: Session, patient_ids: set[int]
) -> tuple[dict[int, User], dict[int, PatientProfile]]:
    """Carga pacientes y perfiles en dos consultas, sin N+1."""
    if not patient_ids:
        return {}, {}
    users = db.query(User).filter(User.id.in_(patient_ids)).all()
    profiles = (
        db.query(PatientProfile)
        .filter(PatientProfile.user_id.in_(patient_ids))
        .all()
    )
    return {u.id: u for u in users}, {p.user_id: p for p in profiles}


def _doctor_name(doctor: Doctor | None) -> str | None:
    if doctor and doctor.user:
        return f"{doctor.user.first_name} {doctor.user.last_name}".strip()
    return None


def _patient_name(patient: User | None) -> str | None:
    if patient:
        return f"{patient.first_name} {patient.last_name}".strip()
    return None


@router.get("", response_model=AdminPrescriptionListResponse)
def list_all_prescriptions(
    doctor_id: Optional[int] = Query(default=None),
    patient_id: Optional[int] = Query(default=None),
    status: Optional[PrescriptionStatus] = Query(default=None),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Lista todas las recetas con filtros (solo admin)."""
    query = db.query(Prescription)

    if doctor_id is not None:
        query = query.filter(Prescription.doctor_id == doctor_id)

    if patient_id is not None:
        query = query.filter(Prescription.patient_id == patient_id)

    if status is not None:
        query = query.filter(Prescription.status == status)

    if from_date is not None:
        query = query.filter(
            Prescription.issued_at >= scheduling.local_date_start(from_date)
        )

    if to_date is not None:
        query = query.filter(
            Prescription.issued_at <= scheduling.local_date_end(to_date)
        )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.join(Doctor, Doctor.id == Prescription.doctor_id).join(
            User, User.id == Prescription.patient_id
        )
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                Doctor.license_number.ilike(pattern),
            )
        )

    total = query.count()

    rows = (
        query.order_by(Prescription.issued_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    doctors = _load_doctors(db, {p.doctor_id for p in rows})
    patients, profiles = _load_patients_and_profiles(
        db, {p.patient_id for p in rows}
    )

    item_counts: dict[int, int] = {}
    if rows:
        counts = (
            db.query(PrescriptionItem.prescription_id, func.count())
            .filter(PrescriptionItem.prescription_id.in_([p.id for p in rows]))
            .group_by(PrescriptionItem.prescription_id)
            .all()
        )
        item_counts = {prescription_id: count for prescription_id, count in counts}

    results = []
    for p in rows:
        doctor = doctors.get(p.doctor_id)
        patient = patients.get(p.patient_id)
        profile = profiles.get(p.patient_id)

        results.append(
            AdminPrescriptionResponse(
                id=p.id,
                folio=p.folio,
                doctor_id=p.doctor_id,
                doctor_user_id=p.doctor_user_id,
                doctor_name=_doctor_name(doctor),
                patient_id=p.patient_id,
                patient_user_id=p.patient_user_id,
                patient_name=_patient_name(patient),
                patient_dni=profile.dni if profile else None,
                issued_at=p.issued_at,
                status=p.status,
                cancel_reason=p.cancel_reason,
                item_count=item_counts.get(p.id, 0),
            )
        )

    return AdminPrescriptionListResponse(
        items=results,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/medical-orders", response_model=AdminMedicalOrderListResponse)
def list_all_medical_orders(
    doctor_id: Optional[int] = Query(default=None),
    patient_id: Optional[int] = Query(default=None),
    status: Optional[MedicalOrderStatus] = Query(default=None),
    type: Optional[str] = Query(default=None),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Lista todas las ordenes medicas con filtros (solo admin)."""
    from app.models.enums import MedicalOrderType

    query = db.query(MedicalOrder)

    if doctor_id is not None:
        query = query.filter(MedicalOrder.doctor_id == doctor_id)

    if patient_id is not None:
        query = query.filter(MedicalOrder.patient_id == patient_id)

    if status is not None:
        query = query.filter(MedicalOrder.status == status)

    if type is not None:
        try:
            from app.models.enums import MedicalOrderType
            query = query.filter(MedicalOrder.type == MedicalOrderType(type))
        except ValueError:
            pass  # ignorar tipo invalido

    if from_date is not None:
        query = query.filter(
            MedicalOrder.issued_at >= scheduling.local_date_start(from_date)
        )

    if to_date is not None:
        query = query.filter(
            MedicalOrder.issued_at <= scheduling.local_date_end(to_date)
        )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.join(Doctor, Doctor.id == MedicalOrder.doctor_id).join(
            User, User.id == MedicalOrder.patient_id
        )
        query = query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                Doctor.license_number.ilike(pattern),
            )
        )

    total = query.count()

    rows = (
        query.order_by(MedicalOrder.issued_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    doctors = _load_doctors(db, {o.doctor_id for o in rows})
    patients, profiles = _load_patients_and_profiles(
        db, {o.patient_id for o in rows}
    )

    results = []
    for o in rows:
        doctor = doctors.get(o.doctor_id)
        patient = patients.get(o.patient_id)
        profile = profiles.get(o.patient_id)

        results.append(
            AdminMedicalOrderResponse(
                id=o.id,
                folio=o.folio,
                doctor_id=o.doctor_id,
                doctor_user_id=o.doctor_user_id,
                doctor_name=_doctor_name(doctor),
                patient_id=o.patient_id,
                patient_user_id=o.patient_user_id,
                patient_name=_patient_name(patient),
                patient_dni=profile.dni if profile else None,
                type=o.type.value,
                issued_at=o.issued_at,
                status=o.status,
                cancel_reason=o.cancel_reason,
            )
        )

    return AdminMedicalOrderListResponse(
        items=results,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{prescription_id}/pdf")
def admin_download_prescription_pdf(
    prescription_id: int,
    request: Request,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin descarga PDF de receta (auditado)."""
    pdf_data = prescriptions.get_prescription_for_pdf(db, prescription_id)
    if not pdf_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos esa receta.",
        )

    # Auditar descarga
    from app.services import audit
    audit.log(
        db,
        actor_user_id=current_admin.id,
        action="prescription_pdf_downloaded",
        entity_type="prescription",
        entity_id=prescription_id,
        ip=audit.client_ip(request),
        metadata={"folio": pdf_data["folio"]},
    )

    pdf_bytes = pdf.generate_prescription_pdf_bytes(pdf_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="receta-{pdf_data["folio"]}.pdf"'
        },
    )


@router.get("/medical-orders/{order_id}/pdf")
def admin_download_order_pdf(
    order_id: int,
    request: Request,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin descarga PDF de orden medica (auditado)."""
    pdf_data = prescriptions.get_medical_order_for_pdf(db, order_id)
    if not pdf_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos esa orden.",
        )

    from app.services import audit
    audit.log(
        db,
        actor_user_id=current_admin.id,
        action="medical_order_pdf_downloaded",
        entity_type="medical_order",
        entity_id=order_id,
        ip=audit.client_ip(request),
        metadata={"folio": pdf_data["folio"]},
    )

    pdf_bytes = pdf.generate_medical_order_pdf_bytes(pdf_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="orden-{pdf_data["folio"]}.pdf"'
        },
    )


@router.get("/doctors/{doctor_id}/activity", response_model=AdminDoctorActivityResponse)
def get_doctor_activity(
    doctor_id: int,
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    """Actividad de un medico (recetas/ordenes emitidas/anuladas, pacientes atendidos)."""
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medico no encontrado.",
        )

    # Filtros de fecha
    date_filter_presc = []
    date_filter_order = []
    if from_date:
        date_filter_presc.append(Prescription.issued_at >= scheduling.local_date_start(from_date))
        date_filter_order.append(MedicalOrder.issued_at >= scheduling.local_date_start(from_date))
    if to_date:
        date_filter_presc.append(Prescription.issued_at <= scheduling.local_date_end(to_date))
        date_filter_order.append(MedicalOrder.issued_at <= scheduling.local_date_end(to_date))

    # Recetas emitidas
    presc_issued = db.query(Prescription).filter(
        Prescription.doctor_id == doctor_id,
        *date_filter_presc,
    ).count()

    # Recetas anuladas
    presc_cancelled = db.query(Prescription).filter(
        Prescription.doctor_id == doctor_id,
        Prescription.status == PrescriptionStatus.CANCELLED,
        *date_filter_presc,
    ).count()

    # Ordenes emitidas
    orders_issued = db.query(MedicalOrder).filter(
        MedicalOrder.doctor_id == doctor_id,
        *date_filter_order,
    ).count()

    # Ordenes anuladas
    orders_cancelled = db.query(MedicalOrder).filter(
        MedicalOrder.doctor_id == doctor_id,
        MedicalOrder.status == MedicalOrderStatus.CANCELLED,
        *date_filter_order,
    ).count()

    # Pacientes unicos atendidos (con receta u orden en el periodo)
    patient_ids = set()
    if date_filter_presc:
        p_ids = db.query(Prescription.patient_id).filter(
            Prescription.doctor_id == doctor_id,
            *date_filter_presc,
        ).all()
        patient_ids.update([p[0] for p in p_ids])
    if date_filter_order:
        o_ids = db.query(MedicalOrder.patient_id).filter(
            MedicalOrder.doctor_id == doctor_id,
            *date_filter_order,
        ).all()
        patient_ids.update([p[0] for p in o_ids])

    activity = DoctorActivityResponse(
        doctor_id=doctor.id,
        doctor_name=f"{doctor.user.first_name} {doctor.user.last_name}".strip() if doctor.user else "—",
        prescriptions_issued=presc_issued,
        prescriptions_cancelled=presc_cancelled,
        orders_issued=orders_issued,
        orders_cancelled=orders_cancelled,
        patients_attended=len(patient_ids),
    )

    return AdminDoctorActivityResponse(
        items=[activity],
        total=1,
        limit=limit,
        offset=offset,
    )
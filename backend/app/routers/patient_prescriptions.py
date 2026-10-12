from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.doctor import Doctor
from app.models.enums import MedicalOrderStatus, PrescriptionStatus, Role
from app.models.prescription import Prescription, MedicalOrder
from app.models.user import User
from app.schemas.prescription import (
    MedicalOrderListResponse,
    PrescriptionListResponse,
)
from app.services import prescriptions, pdf

router = APIRouter(prefix="/prescriptions", tags=["Patient prescriptions"])


def _ensure_can_view(
    db: Session,
    current_user: User,
    *,
    patient_id: int,
    doctor_id: int,
    detail: str,
) -> None:
    """Autoriza la descarga de un PDF de receta/orden.

    Puede el paciente dueño, el medico emisor o un admin. Cualquier otro caso
    (incluido otro medico o un rol inesperado) es 404: no filtramos la
    existencia del recurso.
    """
    if current_user.role == Role.ADMIN:
        return

    if current_user.role == Role.PATIENT and patient_id == current_user.id:
        return

    if current_user.role == Role.DOCTOR:
        doctor = (
            db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        )
        if doctor is not None and doctor.id == doctor_id:
            return

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail,
    )


@router.get("", response_model=PrescriptionListResponse)
def list_my_prescriptions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: PrescriptionStatus | None = Query(default=None),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Lista las recetas del paciente autenticado."""
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden acceder a sus recetas.",
        )

    query = db.query(Prescription).filter(Prescription.patient_id == current_user.id)

    if status:
        query = query.filter(Prescription.status == status)

    total = query.count()

    rows = (
        query.order_by(Prescription.issued_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return PrescriptionListResponse(
        items=rows,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{prescription_id}/pdf")
def download_prescription_pdf(
    prescription_id: int,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Descarga el PDF de una receta (regenera on-demand)."""
    prescription = db.get(Prescription, prescription_id)

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos esa receta.",
        )

    _ensure_can_view(
        db,
        current_user,
        patient_id=prescription.patient_id,
        doctor_id=prescription.doctor_id,
        detail="No encontramos esa receta.",
    )

    # Regenerar PDF on-demand
    pdf_data = prescriptions.get_prescription_for_pdf(db, prescription_id)
    if not pdf_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pudimos generar el PDF.",
        )

    pdf_bytes = pdf.generate_prescription_pdf_bytes(pdf_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="receta-{pdf_data["folio"]}.pdf"'
        },
    )


@router.get("/orders", response_model=MedicalOrderListResponse)
def list_my_orders(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: MedicalOrderStatus | None = Query(default=None),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Lista las ordenes medicas del paciente autenticado."""
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden acceder a sus ordenes.",
        )

    query = db.query(MedicalOrder).filter(MedicalOrder.patient_id == current_user.id)

    if status:
        query = query.filter(MedicalOrder.status == status)

    total = query.count()

    rows = (
        query.order_by(MedicalOrder.issued_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return MedicalOrderListResponse(
        items=rows,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/orders/{order_id}/pdf")
def download_order_pdf(
    order_id: int,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Descarga el PDF de una orden medica (regenera on-demand)."""
    order = db.get(MedicalOrder, order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos esa orden.",
        )

    _ensure_can_view(
        db,
        current_user,
        patient_id=order.patient_id,
        doctor_id=order.doctor_id,
        detail="No encontramos esa orden.",
    )

    pdf_data = prescriptions.get_medical_order_for_pdf(db, order_id)
    if not pdf_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pudimos generar el PDF.",
        )

    pdf_bytes = pdf.generate_medical_order_pdf_bytes(pdf_data)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="orden-{pdf_data["folio"]}.pdf"'
        },
    )
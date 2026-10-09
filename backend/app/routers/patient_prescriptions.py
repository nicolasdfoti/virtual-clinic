from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.enums import MedicalOrderStatus, PrescriptionStatus, Role
from app.models.prescription import Prescription, MedicalOrder
from app.models.user import User
from app.schemas.prescription import (
    MedicalOrderListResponse,
    PrescriptionListResponse,
)
from app.services import prescriptions, pdf

router = APIRouter(prefix="/prescriptions", tags=["Patient prescriptions"])


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

    # Solo el paciente dueño, el medico emisor o admin pueden descargar
    if current_user.role == Role.PATIENT and prescription.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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

    if current_user.role == Role.PATIENT and order.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
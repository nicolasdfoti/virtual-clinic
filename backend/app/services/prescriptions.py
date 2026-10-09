"""Servicio de dominio para recetas y ordenes medicas.

Incluye logica de negocio: folios unicos, snapshots, PDFs, almacenamiento.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import CLINIC_TIMEZONE, get_settings
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.enums import MedicalOrderStatus, MedicalOrderType, PrescriptionStatus
from app.models.patient_profile import PatientProfile
from app.models.prescription import Prescription, PrescriptionItem, MedicalOrder
from app.models.user import User
from app.services import pdf
from app.services.storage import storage as storage_backend


settings = get_settings()
CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)


def _next_folio_number(db: Session, prefix: str) -> int:
    """Obtiene el siguiente numero de folio para el prefijo (RX- u ORD-).

    Usa el año actual y busca el maximo numero existente.
    """
    year = datetime.now(CLINIC_TZ).year
    pattern = f"{prefix}{year}-%"
    stmt = select(func.max(Prescription.folio)).where(Prescription.folio.like(pattern))
    # Para medical orders, usar MedicalOrder
    max_folio = db.execute(stmt).scalar()

    if max_folio:
        # Formato: RX-2026-000123 -> extraer 000123
        try:
            last_num = int(max_folio.split("-")[-1])
            return last_num + 1
        except (ValueError, IndexError):
            return 1
    return 1


def _next_medical_order_folio_number(db: Session) -> int:
    """Obtiene el siguiente numero de folio para ordenes medicas (ORD-)."""
    year = datetime.now(CLINIC_TZ).year
    pattern = f"ORD-{year}-%"
    stmt = select(func.max(MedicalOrder.folio)).where(MedicalOrder.folio.like(pattern))
    max_folio = db.execute(stmt).scalar()

    if max_folio:
        try:
            last_num = int(max_folio.split("-")[-1])
            return last_num + 1
        except (ValueError, IndexError):
            return 1
    return 1


def _build_doctor_snapshot(doctor: Doctor) -> dict:
    """Snapshot del medico para guardar en receta/orden."""
    return {
        "name": f"{doctor.user.first_name} {doctor.user.last_name}".strip(),
        "license_number": doctor.license_number,
        "specialty": doctor.specialty,
    }


def _build_patient_snapshot(patient: User, profile) -> dict:
    """Snapshot del paciente para guardar en receta/orden."""
    return {
        "name": f"{patient.first_name} {patient.last_name}".strip(),
        "dni": profile.dni if profile else None,
        "insurance_provider": profile.insurance_provider if profile else None,
    }


def _build_prescription_items_snapshot(items: list[PrescriptionItem]) -> list[dict]:
    """Serializa items de receta para snapshot/PDF."""
    return [
        {
            "medication": item.medication,
            "dose": item.dose,
            "frequency": item.frequency,
            "duration": item.duration,
            "instructions": item.instructions,
        }
        for item in items
    ]


def create_prescription(
    db: Session,
    doctor: Doctor,
    patient: User,
    patient_profile,
    items: list[dict],
    appointment_id: Optional[int] = None,
) -> Prescription:
    """Crea una receta nueva con sus items, genera PDF y lo almacena.

    Args:
        db: Sesion de BD.
        doctor: Medico emisor.
        patient: Paciente destinatario.
        patient_profile: Perfil del paciente (para snapshot).
        items: Lista de dicts con medication, dose, frequency, duration, instructions.
        appointment_id: ID de turno asociado (opcional).

    Returns:
        La receta creada (con PDF ya generado y almacenado).
    """
    # Verificar relacion activa
    from app.models.care_relationship import CareRelationship
    from app.models.enums import CareRelationshipStatus

    rel = db.query(CareRelationship).filter(
        CareRelationship.doctor_id == doctor.id,
        CareRelationship.patient_id == patient.id,
        CareRelationship.status == CareRelationshipStatus.ACTIVE,
    ).first()

    if not rel:
        raise ValueError("No existe relacion activa con este paciente.")

    # Folio unico
    folio_num = _next_folio_number(db, "RX-")
    year = datetime.now(CLINIC_TZ).year
    folio = f"RX-{year}-{folio_num:06d}"

    # Snapshots
    doctor_snap = _build_doctor_snapshot(doctor)
    patient_snap = _build_patient_snapshot(patient, patient_profile)

    # Crear receta
    prescription = Prescription(
        folio=folio,
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_id=appointment_id,
        status=PrescriptionStatus.ACTIVE,
        doctor_snapshot=json.dumps(doctor_snap),
        patient_snapshot=json.dumps(patient_snap),
    )
    db.add(prescription)
    db.flush()  # Para obtener ID

    # Items
    created_items = []
    for item_data in items:
        item = PrescriptionItem(
            prescription_id=prescription.id,
            medication=item_data["medication"],
            dose=item_data["dose"],
            frequency=item_data["frequency"],
            duration=item_data["duration"],
            instructions=item_data.get("instructions"),
        )
        db.add(item)
        created_items.append(item)

    db.flush()

    # Generar PDF
    pdf_data = {
        "folio": prescription.folio,
        "issued_at": prescription.issued_at,
        "status": prescription.status,
        "doctor_snapshot": doctor_snap,
        "patient_snapshot": patient_snap,
        "items": _build_prescription_items_snapshot(created_items),
    }

    pdf_bytes = pdf.generate_prescription_pdf_bytes(pdf_data)
    sha256 = storage_backend.save(pdf_bytes, f"prescriptions/{prescription.id}.pdf")

    # Guardar ruta y hash en la receta (podriamos agregar campos, por ahora solo almacenamos)
    # Nota: el modelo no tiene campos para pdf_path/pdf_sha256; se podrian agregar en futura migracion
    # Por ahora, el PDF se guarda en storage y se regenera on-demand si hace falta

    db.commit()
    db.refresh(prescription)

    return prescription


def cancel_prescription(
    db: Session,
    prescription: Prescription,
    cancel_reason: str,
    actor_user_id: int,
) -> Prescription:
    """Anula una receta (inmutable: solo cambio de estado)."""
    if prescription.status == PrescriptionStatus.CANCELLED:
        raise ValueError("La receta ya esta anulada.")

    prescription.status = PrescriptionStatus.CANCELLED
    prescription.cancel_reason = cancel_reason

    db.commit()
    db.refresh(prescription)

    return prescription


def create_medical_order(
    db: Session,
    doctor: Doctor,
    patient: User,
    patient_profile,
    type_: str,
    studies: str,
    presumptive_diagnosis: Optional[str],
    appointment_id: Optional[int] = None,
) -> MedicalOrder:
    """Crea una orden medica nueva, genera PDF y lo almacena."""
    from app.models.care_relationship import CareRelationship
    from app.models.enums import CareRelationshipStatus

    rel = db.query(CareRelationship).filter(
        CareRelationship.doctor_id == doctor.id,
        CareRelationship.patient_id == patient.id,
        CareRelationship.status == CareRelationshipStatus.ACTIVE,
    ).first()

    if not rel:
        raise ValueError("No existe relacion activa con este paciente.")

    # Validar tipo
    try:
        order_type = MedicalOrderType(type_)
    except ValueError:
        raise ValueError(f"Tipo de orden invalido: {type_}")

    # Folio unico
    folio_num = _next_medical_order_folio_number(db)
    year = datetime.now(CLINIC_TZ).year
    folio = f"ORD-{year}-{folio_num:06d}"

    # Snapshots
    doctor_snap = _build_doctor_snapshot(doctor)
    patient_snap = _build_patient_snapshot(patient, patient_profile)

    # Crear orden
    order = MedicalOrder(
        folio=folio,
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_id=appointment_id,
        type=order_type,
        studies=studies,
        presumptive_diagnosis=presumptive_diagnosis,
        status=MedicalOrderStatus.ACTIVE,
        doctor_snapshot=json.dumps(doctor_snap),
        patient_snapshot=json.dumps(patient_snap),
    )
    db.add(order)
    db.flush()

    # Generar PDF
    pdf_data = {
        "folio": order.folio,
        "issued_at": order.issued_at,
        "status": order.status,
        "type": order.type.value,
        "doctor_snapshot": doctor_snap,
        "patient_snapshot": patient_snap,
        "studies": order.studies,
        "presumptive_diagnosis": order.presumptive_diagnosis,
    }

    pdf_bytes = pdf.generate_medical_order_pdf_bytes(pdf_data)
    sha256 = storage_backend.save(pdf_bytes, f"orders/{order.id}.pdf")

    db.commit()
    db.refresh(order)

    return order


def cancel_medical_order(
    db: Session,
    order: MedicalOrder,
    cancel_reason: str,
    actor_user_id: int,
) -> MedicalOrder:
    """Anula una orden medica."""
    if order.status == MedicalOrderStatus.CANCELLED:
        raise ValueError("La orden ya esta anulada.")

    order.status = MedicalOrderStatus.CANCELLED
    order.cancel_reason = cancel_reason

    db.commit()
    db.refresh(order)

    return order


def get_prescription_for_pdf(db: Session, prescription_id: int) -> dict:
    """Obtiene datos completos de receta para regenerar PDF on-demand."""
    from app.models.care_relationship import CareRelationship
    from app.models.enums import CareRelationshipStatus

    prescription = db.get(Prescription, prescription_id)
    if not prescription:
        return None

    # Cargar relaciones
    doctor = db.get(Doctor, prescription.doctor_id)
    patient = db.get(User, prescription.patient_id)
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient.id).first() if patient else None

    items = db.query(PrescriptionItem).filter(
        PrescriptionItem.prescription_id == prescription.id
    ).all()

    doctor_snap = _build_doctor_snapshot(doctor) if doctor else {}
    patient_snap = _build_patient_snapshot(patient, profile) if patient else {}

    return {
        "folio": prescription.folio,
        "issued_at": prescription.issued_at,
        "status": prescription.status,
        "doctor_snapshot": doctor_snap,
        "patient_snapshot": patient_snap,
        "items": _build_prescription_items_snapshot(items),
        "cancel_reason": prescription.cancel_reason,
    }


def get_medical_order_for_pdf(db: Session, order_id: int) -> dict:
    """Obtiene datos completos de orden para regenerar PDF on-demand."""
    order = db.get(MedicalOrder, order_id)
    if not order:
        return None

    doctor = db.get(Doctor, order.doctor_id)
    patient = db.get(User, order.patient_id)
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient.id).first() if patient else None

    doctor_snap = _build_doctor_snapshot(doctor) if doctor else {}
    patient_snap = _build_patient_snapshot(patient, profile) if patient else {}

    return {
        "folio": order.folio,
        "issued_at": order.issued_at,
        "status": order.status,
        "type": order.type.value,
        "doctor_snapshot": doctor_snap,
        "patient_snapshot": patient_snap,
        "studies": order.studies,
        "presumptive_diagnosis": order.presumptive_diagnosis,
        "cancel_reason": order.cancel_reason,
    }
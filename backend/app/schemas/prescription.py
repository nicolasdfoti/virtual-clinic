from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.enums import MedicalOrderStatus, MedicalOrderType, PrescriptionStatus


class PrescriptionItemBase(BaseModel):
    """Datos base de un item de receta."""

    medication: str = Field(..., max_length=200, description="Nombre del medicamento")
    dose: str = Field(..., max_length=100, description="Dosis (ej: 500 mg)")
    frequency: str = Field(..., max_length=200, description="Frecuencia (ej: Cada 8 horas)")
    duration: str = Field(..., max_length=100, description="Duracion (ej: 7 dias)")
    instructions: Optional[str] = Field(
        default=None, max_length=500, description="Indicaciones adicionales"
    )


class PrescriptionItemCreate(PrescriptionItemBase):
    """Item para crear receta."""

    pass


class PrescriptionItemResponse(PrescriptionItemBase):
    """Item de receta en respuesta."""

    id: int
    prescription_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PrescriptionCreate(BaseModel):
    """Datos para emitir una receta."""

    patient_id: int = Field(..., description="ID del paciente")
    appointment_id: Optional[int] = Field(
        default=None, description="ID del turno asociado (opcional)"
    )
    items: list[PrescriptionItemCreate] = Field(
        ..., min_length=1, description="Al menos un medicamento"
    )

    @field_validator("items")
    @classmethod
    def at_least_one_item(cls, v: list[PrescriptionItemCreate]) -> list[PrescriptionItemCreate]:
        if not v:
            raise ValueError("La receta debe tener al menos un item.")
        return v


class PrescriptionCancelRequest(BaseModel):
    """Body para anular una receta."""

    cancel_reason: str = Field(..., max_length=500, description="Motivo de la anulacion")


class PrescriptionItemSnapshot(BaseModel):
    """Snapshot de un item para guardar en la receta."""

    medication: str
    dose: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionSnapshot(BaseModel):
    """Snapshot completo de la receta para el PDF/auditoria."""

    folio: str
    issued_at: datetime
    status: str
    doctor_snapshot: dict
    patient_snapshot: dict
    items: list[PrescriptionItemSnapshot]
    cancel_reason: Optional[str] = None


class PrescriptionResponse(BaseModel):
    """Receta en respuesta (lista y detalle)."""

    id: int
    folio: str
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int]
    issued_at: datetime
    status: PrescriptionStatus
    cancel_reason: Optional[str]
    items: list[PrescriptionItemResponse]

    class Config:
        from_attributes = True


class PrescriptionDetailResponse(PrescriptionResponse):
    """Detalle completo de receta con snapshots para PDF."""

    doctor_snapshot: dict
    patient_snapshot: dict
    cancel_reason: Optional[str] = None


class MedicalOrderCreate(BaseModel):
    """Datos para emitir una orden medica."""

    patient_id: int = Field(..., description="ID del paciente")
    appointment_id: Optional[int] = Field(
        default=None, description="ID del turno asociado (opcional)"
    )
    type: str = Field(..., description="Tipo: LAB, IMAGING, REFERRAL, OTHER")
    studies: str = Field(..., min_length=1, max_length=5000, description="Estudios solicitados")
    presumptive_diagnosis: Optional[str] = Field(
        default=None, max_length=500, description="Diagnostico presuntivo"
    )

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        from app.models.enums import MedicalOrderType

        try:
            MedicalOrderType(v)
        except ValueError:
            valid = [t.value for t in MedicalOrderType]
            raise ValueError(f"Tipo invalido. Validos: {', '.join(valid)}")
        return v


class MedicalOrderCancelRequest(BaseModel):
    """Body para anular una orden medica."""

    cancel_reason: str = Field(..., max_length=500, description="Motivo de la anulacion")


class MedicalOrderResponse(BaseModel):
    """Orden medica en respuesta."""

    id: int
    folio: str
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int]
    type: str
    studies: str
    presumptive_diagnosis: Optional[str]
    issued_at: datetime
    status: MedicalOrderStatus
    cancel_reason: Optional[str]

    class Config:
        from_attributes = True


class MedicalOrderDetailResponse(MedicalOrderResponse):
    """Detalle completo de orden para PDF."""

    doctor_snapshot: dict
    patient_snapshot: dict
    cancel_reason: Optional[str] = None


class PrescriptionListResponse(BaseModel):
    items: list[PrescriptionResponse]
    total: int
    limit: int
    offset: int


class MedicalOrderListResponse(BaseModel):
    items: list[MedicalOrderResponse]
    total: int
    limit: int
    offset: int


class AdminPrescriptionResponse(BaseModel):
    """Receta para listado admin."""

    id: int
    folio: str
    doctor_id: int
    doctor_name: Optional[str]
    patient_id: int
    patient_name: Optional[str]
    patient_dni: Optional[str]
    issued_at: datetime
    status: PrescriptionStatus
    cancel_reason: Optional[str]
    item_count: int

    class Config:
        from_attributes = True


class AdminMedicalOrderResponse(BaseModel):
    """Orden medica para listado admin."""

    id: int
    folio: str
    doctor_id: int
    doctor_name: Optional[str]
    patient_id: int
    patient_name: Optional[str]
    patient_dni: Optional[str]
    type: str
    issued_at: datetime
    status: MedicalOrderStatus
    cancel_reason: Optional[str]

    class Config:
        from_attributes = True


class AdminPrescriptionListResponse(BaseModel):
    items: list[AdminPrescriptionResponse]
    total: int
    limit: int
    offset: int


class AdminMedicalOrderListResponse(BaseModel):
    items: list[AdminMedicalOrderResponse]
    total: int
    limit: int
    offset: int


class DoctorActivityResponse(BaseModel):
    """Actividad de un medico (para admin)."""

    doctor_id: int
    doctor_name: str
    prescriptions_issued: int
    prescriptions_cancelled: int
    orders_issued: int
    orders_cancelled: int
    patients_attended: int

    class Config:
        from_attributes = True


class AdminDoctorActivityResponse(BaseModel):
    items: list[DoctorActivityResponse]
    total: int
    limit: int
    offset: int
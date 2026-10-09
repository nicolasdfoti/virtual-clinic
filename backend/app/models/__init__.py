"""Modelos de la aplicacion.

Este import no es decorativo: SQLAlchemy registra una tabla en
`Base.metadata` en el momento en que se importa su clase. Con este archivo
vacio, `import app.models` no registraba nada y `Base.metadata.create_all()`
creaba cero tablas sin fallar, igual que `alembic --autogenerate` no detectaba
cambios.

Importar los modelos aca es la forma de que quien use `Base.metadata` no tenga
que acordarse de importar cada modulo a mano.
"""
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.care_relationship import CareRelationship
from app.models.doctor import Doctor
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_time_off import DoctorTimeOff
from app.models.enums import (
    ACTIVE_APPOINTMENT_STATUSES,
    AppointmentModality,
    AppointmentStatus,
    CareRelationshipStatus,
    MedicalOrderStatus,
    MedicalOrderType,
    PrescriptionStatus,
    Role,
)
from app.models.prescription import MedicalOrder
from app.models.patient_profile import PatientProfile
from app.models.prescription import Prescription, PrescriptionItem
from app.models.user import User

__all__ = [
    "ACTIVE_APPOINTMENT_STATUSES",
    "Appointment",
    "AppointmentModality",
    "AppointmentStatus",
    "AuditLog",
    "CareRelationship",
    "CareRelationshipStatus",
    "Doctor",
    "DoctorAvailability",
    "DoctorTimeOff",
    "MedicalOrder",
    "MedicalOrderStatus",
    "MedicalOrderType",
    "PatientProfile",
    "Prescription",
    "PrescriptionItem",
    "PrescriptionStatus",
    "Role",
    "User",
]

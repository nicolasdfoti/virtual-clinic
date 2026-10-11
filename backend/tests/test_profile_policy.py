"""Tests de la politica de visibilidad de perfiles (profile_policy).

Cubre la matriz completa rol x rol para la funcion can_view.
"""
import pytest

from app.models.enums import Role
from app.models.user import User
from app.services.profile_policy import can_view


def _make_user(user_id: int, role: Role) -> User:
    """Crea un usuario mock para tests."""
    user = User(
        id=user_id,
        email=f"user{user_id}@example.com",
        password_hash="hash",
        first_name="Nombre",
        last_name="Apellido",
        role=role,
    )
    return user


class TestProfilePolicy:
    """Matriz completa rol x rol para can_view."""

    # --- Propio perfil (siempre visible) ---

    def test_patient_ve_propio_perfil(self):
        user = _make_user(1, Role.PATIENT)
        assert can_view(user, user) is True

    def test_doctor_ve_propio_perfil(self):
        user = _make_user(2, Role.DOCTOR)
        assert can_view(user, user) is True

    def test_admin_ve_propio_perfil(self):
        user = _make_user(3, Role.ADMIN)
        assert can_view(user, user) is True

    # --- PATIENT mirando a otros ---

    def test_patient_ve_doctor(self):
        patient = _make_user(1, Role.PATIENT)
        doctor = _make_user(2, Role.DOCTOR)
        assert can_view(patient, doctor) is True

    def test_patient_no_ve_admin(self):
        patient = _make_user(1, Role.PATIENT)
        admin = _make_user(3, Role.ADMIN)
        assert can_view(patient, admin) is False

    def test_patient_no_ve_otro_patient(self):
        patient1 = _make_user(1, Role.PATIENT)
        patient2 = _make_user(4, Role.PATIENT)
        assert can_view(patient1, patient2) is False

    # --- DOCTOR mirando a otros ---

    def test_doctor_ve_patient(self):
        doctor = _make_user(2, Role.DOCTOR)
        patient = _make_user(1, Role.PATIENT)
        assert can_view(doctor, patient) is True

    def test_doctor_ve_doctor(self):
        doctor1 = _make_user(2, Role.DOCTOR)
        doctor2 = _make_user(5, Role.DOCTOR)
        assert can_view(doctor1, doctor2) is True

    def test_doctor_ve_admin(self):
        doctor = _make_user(2, Role.DOCTOR)
        admin = _make_user(3, Role.ADMIN)
        assert can_view(doctor, admin) is True

    # --- ADMIN mirando a otros ---

    def test_admin_ve_patient(self):
        admin = _make_user(3, Role.ADMIN)
        patient = _make_user(1, Role.PATIENT)
        assert can_view(admin, patient) is True

    def test_admin_ve_doctor(self):
        admin = _make_user(3, Role.ADMIN)
        doctor = _make_user(2, Role.DOCTOR)
        assert can_view(admin, doctor) is True

    def test_admin_ve_admin(self):
        admin1 = _make_user(3, Role.ADMIN)
        admin2 = _make_user(6, Role.ADMIN)
        assert can_view(admin1, admin2) is True
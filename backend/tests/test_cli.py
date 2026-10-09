"""Tests de `python -m app.cli create-admin`.

La contraseña es sagrada en este comando: solo se pide por getpass (prompt
oculto) y NUNCA via argumento, porque un argumento queda en el historial del
shell y en los logs del proceso.
"""
import pytest

from app.core.security import verify_password
from app.models.enums import Role
from app.models.user import User

from tests.conftest import create_user


@pytest.fixture
def session_factory(db_session):
    """idem create_admin(session_factory=...): los tests inyectan la sesion de
    prueba, produccion usa SessionLocal."""

    def factory():
        # Cada llamada devuelve una sesion nueva sobre la misma base de test,
        # como haria SessionLocal en produccion.
        from tests.conftest import TestingSessionLocal

        return TestingSessionLocal()

    return factory


class TestCreateAdmin:
    def test_crea_el_admin_y_hashea_la_password(self, db_session, session_factory):
        from app.cli import create_admin

        result = create_admin(
            email=" admin@example.com ",
            first_name="  Ana  ",
            last_name=" Ruiz ",
            password="Password123",
            session_factory=session_factory,
        )

        assert result == 0

        admin = db_session.query(User).filter(User.email == "admin@example.com").one()
        assert admin.role == Role.ADMIN
        assert admin.is_active is True
        assert admin.must_change_password is False
        assert verify_password("Password123", admin.password_hash)

    def test_falla_si_el_email_ya_existe(self, db_session, session_factory):
        from app.cli import create_admin

        create_user(db_session, email="admin@example.com", role=Role.ADMIN)

        result = create_admin(
            email="admin@example.com",
            first_name="Ana",
            last_name="Ruiz",
            password="Password123",
            session_factory=session_factory,
        )

        assert result == 1
        assert db_session.query(User).filter(User.email == "admin@example.com").count() == 1

    def test_falla_con_password_corta(self, session_factory):
        from app.cli import create_admin

        result = create_admin(
            email="admin@example.com",
            first_name="Ana",
            last_name="Ruiz",
            password="corta7",
            session_factory=session_factory,
        )

        assert result == 1

    def test_falla_con_password_de_mas_de_72_bytes(self, session_factory):
        from app.cli import create_admin

        result = create_admin(
            email="admin@example.com",
            first_name="Ana",
            last_name="Ruiz",
            password="ñ" * 73,
            session_factory=session_factory,
        )

        assert result == 1


class TestMain:
    """El parsing y los prompts: la password nunca viaja por argumento."""

    def test_main_arranca_crear_admin_sin_argumentos(self, monkeypatch, session_factory):
        from app import cli

        prompts = []

        def fake_input(message):
            prompts.append(message)
            return {"Email: ": "admin@example.com", "Nombre: ": "Ana", "Apellido: ": "Ruiz"}[message]

        def fake_getpass(message):
            assert "Contraseña" in message
            return "Password123"

        calls = {}

        def fake_create_admin(email, first_name, last_name, password, session_factory=None):
            calls["email"] = email
            calls["first_name"] = first_name
            calls["last_name"] = last_name
            calls["password"] = password
            calls["session_factory"] = session_factory
            return 0

        monkeypatch.setattr("builtins.input", fake_input)
        monkeypatch.setattr("getpass.getpass", fake_getpass)
        monkeypatch.setattr(cli, "create_admin", fake_create_admin)

        result = cli.main(["create-admin"])

        assert result == 0
        assert calls["email"] == "admin@example.com"
        assert calls["password"] == "Password123"

    def test_main_rechaza_la_password_como_argumento(self):
        """create-admin no acepta ningun argumento posicional: pasar la clave
        como argumento es un error de parsing, no que se la guarde."""
        from app import cli

        with pytest.raises(SystemExit):
            cli.main(["create-admin", "Password123"])
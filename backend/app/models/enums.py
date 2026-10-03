import enum


class Role(str, enum.Enum):
    """Rol del usuario. Los valores van en mayusculas y son los que se
    persisten en la base: `PATIENT`, `DOCTOR`, `ADMIN`.

    Heredar de `str` evita tener que castear a mano al leer y deja que
    Pydantic los serialice directo como texto en la respuesta.
    """

    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"
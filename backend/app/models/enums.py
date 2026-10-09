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


class CareRelationshipStatus(str, enum.Enum):
    """Estado del vinculo entre un medico y un paciente.

    No se borra la fila al desvincular: se pasa a `ENDED` para conservar el
    historial de quien atendio a quien.
    """

    ACTIVE = "ACTIVE"
    ENDED = "ENDED"
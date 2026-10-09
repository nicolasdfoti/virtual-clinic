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


class AppointmentStatus(str, enum.Enum):
    """Estado de un turno.

    `SCHEDULED` y `CONFIRMED` son los estados "activos": ocupan la agenda y son
    los unicos que bloquean una franja (el constraint de exclusion de Postgres
    mira justo estos dos). `CANCELLED`, `COMPLETED` y `NO_SHOW` son finales y
    liberan el horario.
    """

    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class AppointmentModality(str, enum.Enum):
    """Como se atiende el turno. No hay videollamada propia: VIDEO solo lleva
    un `video_url` externo (Meet/Zoom/Jitsi) que carga el medico."""

    VIDEO = "VIDEO"
    IN_PERSON = "IN_PERSON"


# Estados que ocupan la agenda. Un turno en uno de estos estados impide que se
# reserve una franja superpuesta con el mismo medico.
ACTIVE_APPOINTMENT_STATUSES = (
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
)
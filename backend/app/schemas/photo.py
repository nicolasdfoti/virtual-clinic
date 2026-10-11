from pydantic import BaseModel, field_validator


# Tope de la data URL de la foto. El cliente la redimensiona a ~256px antes de
# subirla, asi que este limite es holgado y solo frena abusos.
MAX_PHOTO_DATA_URL_LENGTH = 400_000


class PhotoUpdateRequest(BaseModel):
    """Alta, cambio o borrado de la foto de perfil.

    `photo` es una data URL (data:image/png;base64,...) o None para borrarla.
    El cliente la redimensiona antes de mandarla.
    """

    photo: str | None = None

    @field_validator("photo")
    @classmethod
    def validate_photo(cls, value: str | None) -> str | None:
        if value is None:
            return None

        stripped = value.strip()

        if not stripped:
            return None

        if not stripped.startswith("data:image/"):
            raise ValueError("La foto debe ser una imagen.")

        if ";base64," not in stripped:
            raise ValueError("La foto debe estar codificada en base64.")

        if len(stripped) > MAX_PHOTO_DATA_URL_LENGTH:
            raise ValueError("La foto es demasiado grande.")

        return stripped


class PhotoUpdateResponse(BaseModel):
    photo: str | None = None

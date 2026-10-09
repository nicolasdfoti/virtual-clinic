"""Archivos del paciente (estudios) desde el portal del propio paciente."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.enums import Role
from app.models.user import User
from app.schemas.patient_file import PatientFileListResponse, PatientFileResponse
from app.services import audit, patient_files
from app.services.patient_files import PatientFileError

router = APIRouter(tags=["Patient files"])

settings = get_settings()
ENTITY_TYPE_FILE = "patient_file"

MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/patients/me/files", status_code=status.HTTP_201_CREATED)
async def upload_my_file(
    request: Request,
    file: UploadFile,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Sube un archivo de estudio (PDF/JPG/PNG). Solo paciente autenticado."""
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden subir sus archivos.",
        )

    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe seleccionar un archivo.",
        )

    # Validar tamaño antes de leer todo (UploadFile puede ser grande).
    content = await file.read()
    await file.close()

    try:
        patient_file = patient_files.upload_file(
            db=db,
            patient_id=current_user.id,
            uploader=current_user,
            original_filename=file.filename or "archivo",
            content=content,
        )
    except PatientFileError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    audit.log(
        db,
        actor_user_id=current_user.id,
        action="patient_file_uploaded",
        entity_type=ENTITY_TYPE_FILE,
        entity_id=patient_file.id,
        ip=audit.client_ip(request),
        metadata={
            "patient_id": current_user.id,
            "mime_type": patient_file.mime_type,
            "size": patient_file.size,
            "by": "patient",
        },
    )

    # Para no duplicar schema, devolvemos el objeto ya serializable.
    return PatientFileResponse(
        id=patient_file.id,
        patient_id=patient_file.patient_id,
        uploaded_by_user_id=patient_file.uploaded_by_user_id,
        uploaded_by_name=f"{current_user.first_name} {current_user.last_name}".strip(),
        original_filename=patient_file.original_filename,
        mime_type=patient_file.mime_type,
        size=patient_file.size,
        created_at=patient_file.created_at,
    )


@router.get("/patients/me/files", response_model=PatientFileListResponse)
def list_my_files(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Lista mis archivos de estudio."""
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden acceder a sus archivos.",
        )

    rows, total = patient_files.list_files(db, current_user.id, limit, offset)

    items = []
    for patient_file in rows:
        items.append(
            PatientFileResponse(
                id=patient_file.id,
                patient_id=patient_file.patient_id,
                uploaded_by_user_id=patient_file.uploaded_by_user_id,
                uploaded_by_name=(
                    f"{patient_file.uploaded_by.first_name} {patient_file.uploaded_by.last_name}".strip()
                    if patient_file.uploaded_by is not None
                    else None
                ),
                original_filename=patient_file.original_filename,
                mime_type=patient_file.mime_type,
                size=patient_file.size,
                created_at=patient_file.created_at,
            )
        )

    return PatientFileListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/patients/me/files/{file_id}/download")
def download_my_file(
    file_id: int,
    request: Request,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Descarga uno de mis archivos."""
    if current_user.role != Role.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo pacientes pueden acceder a sus archivos.",
        )

    patient_file = patient_files.get_file(db, current_user.id, file_id)

    if patient_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos ese archivo.",
        )

    try:
        stream = patient_files.open_file(patient_file)
    except PatientFileError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    audit.log(
        db,
        actor_user_id=current_user.id,
        action="patient_file_downloaded",
        entity_type=ENTITY_TYPE_FILE,
        entity_id=patient_file.id,
        ip=audit.client_ip(request),
        metadata={
            "patient_id": current_user.id,
            "uploaded_by": patient_file.uploaded_by_user_id,
            "mime_type": patient_file.mime_type,
            "size": patient_file.size,
            "by": "patient",
        },
    )

    try:
        return StreamingResponse(
            stream,
            media_type=patient_file.mime_type,
            headers={
                "Content-Disposition": (
                    f'inline; filename="{patient_file.original_filename}"'
                )
            },
        )
    except Exception:
        if hasattr(stream, "close"):
            stream.close()
        raise

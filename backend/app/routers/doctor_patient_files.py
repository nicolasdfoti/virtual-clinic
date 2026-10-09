"""Archivos del paciente desde el lado del medico."""
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.schemas.patient_file import PatientFileListResponse, PatientFileResponse
from app.services import audit, patient_files
from app.services.patient_files import PatientFileError

from .doctor import PATIENT_NOT_FOUND_DETAIL, _active_relationship

router = APIRouter(tags=["Doctor - Patient files"])

ENTITY_TYPE_FILE = "patient_file"


@router.post(
    "/doctor/patients/{patient_id}/files",
    response_model=PatientFileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_patient_file(
    patient_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Sube un archivo a la historia del paciente (medico)."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    content = await file.read()
    await file.close()

    try:
        patient_file = patient_files.upload_file(
            db=db,
            patient_id=patient_id,
            uploader=doctor.user,
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
        actor_user_id=doctor.user_id,
        action="patient_file_uploaded",
        entity_type=ENTITY_TYPE_FILE,
        entity_id=patient_file.id,
        ip=audit.client_ip(request) if request else None,
        metadata={
            "patient_id": patient_id,
            "mime_type": patient_file.mime_type,
            "size": patient_file.size,
            "by": "doctor",
        },
    )

    return PatientFileResponse(
        id=patient_file.id,
        patient_id=patient_file.patient_id,
        uploaded_by_user_id=patient_file.uploaded_by_user_id,
        uploaded_by_name=(
            f"{doctor.user.first_name} {doctor.user.last_name}".strip()
            if doctor.user is not None
            else None
        ),
        original_filename=patient_file.original_filename,
        mime_type=patient_file.mime_type,
        size=patient_file.size,
        created_at=patient_file.created_at,
    )


@router.get(
    "/doctor/patients/{patient_id}/files",
    response_model=PatientFileListResponse,
)
def list_patient_files(
    patient_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Lista los archivos de la historia del paciente."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    rows, total = patient_files.list_files(db, patient_id, limit, offset)

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


@router.get("/doctor/patients/{patient_id}/files/{file_id}/download")
def download_patient_file(
    patient_id: int,
    file_id: int,
    request: Request,
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Descarga un archivo de la historia del paciente (auditado)."""
    if _active_relationship(db, doctor.id, patient_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND_DETAIL,
        )

    patient_file = patient_files.get_file(db, patient_id, file_id)

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
        actor_user_id=doctor.user_id,
        action="patient_file_downloaded",
        entity_type=ENTITY_TYPE_FILE,
        entity_id=patient_file.id,
        ip=audit.client_ip(request),
        metadata={
            "patient_id": patient_id,
            "uploaded_by": patient_file.uploaded_by_user_id,
            "mime_type": patient_file.mime_type,
            "size": patient_file.size,
            "by": "doctor",
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

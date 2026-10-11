from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_ready_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationUnreadCountResponse,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

NOTIFICATION_NOT_FOUND = "No encontramos esa notificación."


def _own_notification(
    db: Session,
    notification_id: int,
    current_user: User,
) -> Notification:
    """Devuelve el aviso del usuario o 404.

    Se filtra por user_id: el aviso de otro usuario se trata como inexistente
    para no filtrar la existencia de recursos ajenos.
    """
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=NOTIFICATION_NOT_FOUND,
        )

    return notification


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    only_unread: bool = Query(default=False),
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    """Ultimos avisos del usuario autenticado, del mas nuevo al mas viejo."""
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    if only_unread:
        query = query.filter(Notification.is_read.is_(False))

    return (
        query.order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/unread-count",
    response_model=NotificationUnreadCountResponse,
)
def unread_count(
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    unread = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return NotificationUnreadCountResponse(unread=unread)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    notification = _own_notification(db, notification_id, current_user)

    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


@router.post(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
def mark_all_read(
    current_user: User = Depends(get_current_ready_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({Notification.is_read: True}, synchronize_session=False)

    db.commit()

    return None

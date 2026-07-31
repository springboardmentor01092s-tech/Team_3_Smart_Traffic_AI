from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db, admin_required
from .. import models, schemas

router = APIRouter(
    prefix="/activity",
    tags=["Activity Logs"]
)


# Get all activity logs (Admin Only)
@router.get("/", response_model=list[schemas.ActivityLogResponse])
def get_all_logs(
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    return db.query(models.ActivityLog).all()


# Get activity logs of a specific user (Admin Only)
@router.get("/{user_id}", response_model=list[schemas.ActivityLogResponse])
def get_user_logs(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    return (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.user_id == user_id)
        .all()
    )
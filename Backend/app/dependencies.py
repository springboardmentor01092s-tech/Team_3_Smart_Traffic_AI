from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import SessionLocal
from .auth_handler import verify_access_token
from . import models
from fastapi import HTTPException, status

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        



def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    email = payload.get("sub")

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

def admin_required(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user

def operator_required(current_user=Depends(get_current_user)):
    if current_user.role != "operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator access required"
        )

    return current_user

def commuter_required(current_user=Depends(get_current_user)):
    if current_user.role != "commuter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Commuter access required"
        )

    return current_user
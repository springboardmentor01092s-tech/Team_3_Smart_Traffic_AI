from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..utils import hash_password
from ..database import SessionLocal
from ..dependencies import get_db
from .. import models, schemas
from ..utils import verify_password
from ..auth_handler import create_access_token
from ..dependencies import get_current_user
from ..dependencies import (
    get_current_user,
    admin_required,
    operator_required,
    commuter_required
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    # Find user by email
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    # Check if user exists
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
    "access_token": access_token,
    "token_type": "bearer",
    "role": db_user.role,
    "username": db_user.username,
    "email": db_user.email
}
    
@router.get(
    "/me",
    response_model=schemas.UserResponse
)
def me(current_user = Depends(get_current_user)):
    return current_user

@router.get("/admin")
def admin_dashboard(current_user=Depends(admin_required)):
    return {
        "message": f"Welcome Admin {current_user.username}"
    }
    
@router.get("/operator")
def operator_dashboard(current_user=Depends(operator_required)):
    return {
        "message": f"Welcome Operator {current_user.username}"
    }
    
@router.get("/commuter")
def commuter_dashboard(current_user=Depends(commuter_required)):
    return {
        "message": f"Welcome {current_user.username}"
    }
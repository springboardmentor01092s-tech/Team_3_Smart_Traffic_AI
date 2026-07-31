from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- Activity Log ----------------

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    ip_address: str | None
    created_at: datetime

    class Config:
        from_attributes = True
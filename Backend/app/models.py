from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

# --- User Table ---
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password: Mapped[str]
    role: Mapped[str]  # admin, operator, commuter
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


# --- Traffic Monitoring Table ---
class TrafficData(Base):
    __tablename__ = "traffic_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    road_name: Mapped[str] = mapped_column(index=True)
    vehicle_count: Mapped[int]
    average_speed: Mapped[float]
    congestion_level: Mapped[str]  # Low, Medium, High
    
    weather: Mapped[str] = mapped_column(server_default="Clear", default="Clear")
    accident: Mapped[bool] = mapped_column(server_default="0", default=False)
    
    recorded_at: Mapped[datetime] = mapped_column(server_default=func.now())


# --- AI Prediction Table ---
class TrafficPrediction(Base):
    __tablename__ = "traffic_predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    road_name: Mapped[str] = mapped_column(index=True)
    predicted_congestion_level: Mapped[str]
    estimated_delay_minutes: Mapped[int]
    confidence_score: Mapped[float]
    generated_at: Mapped[datetime] = mapped_column(server_default=func.now())

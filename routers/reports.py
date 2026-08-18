from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io, csv
from datetime import datetime, timedelta

from ..dependencies import get_db, get_current_user
from .. import models

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/traffic-summary")
def traffic_summary(days: int = 7, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    records = db.query(models.TrafficData).filter(models.TrafficData.recorded_at >= since).all()

    summary = {}
    for r in records:
        s = summary.setdefault(r.road_name, {"readings": 0, "total_speed": 0, "high_count": 0})
        s["readings"] += 1
        s["total_speed"] += r.average_speed
        if r.congestion_level == "High":
            s["high_count"] += 1

    return [
        {
            "road_name": road,
            "readings": s["readings"],
            "avg_speed": round(s["total_speed"] / s["readings"], 1),
            "high_congestion_count": s["high_count"],
        }
        for road, s in summary.items()
    ]


@router.get("/export-csv")
def export_csv(days: int = 7, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    since = datetime.utcnow() - timedelta(days=days)
    records = db.query(models.TrafficData).filter(models.TrafficData.recorded_at >= since).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["road_name", "vehicle_count", "average_speed", "congestion_level", "recorded_at"])
    for r in records:
        writer.writerow([r.road_name, r.vehicle_count, r.average_speed, r.congestion_level, r.recorded_at])
    buffer.seek(0)
    return StreamingResponse(
        buffer, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=traffic_report.csv"},
    )

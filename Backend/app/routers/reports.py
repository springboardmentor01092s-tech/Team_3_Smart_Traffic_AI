from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv
from datetime import datetime, timedelta

from ..dependencies import get_db, get_current_user
from .. import models

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/traffic-summary")
def traffic_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)

    records = (
        db.query(models.TrafficData)
        .filter(models.TrafficData.recorded_at >= since)
        .all()
    )

    summary = {}

    total_readings = len(records)
    total_accidents = 0
    total_speed = 0

    congestion_counts = {
        "Low": 0,
        "Medium": 0,
        "High": 0,
    }

    for r in records:

        # Overall statistics
        total_speed += r.average_speed

        if r.accident:
            total_accidents += 1

        if r.congestion_level in congestion_counts:
            congestion_counts[r.congestion_level] += 1

        # Road-wise statistics
        s = summary.setdefault(
            r.road_name,
            {
                "readings": 0,
                "total_speed": 0,
                "high_count": 0,
            },
        )

        s["readings"] += 1
        s["total_speed"] += r.average_speed

        if r.congestion_level == "High":
            s["high_count"] += 1

    average_speed = (
        round(total_speed / total_readings, 1)
        if total_readings > 0
        else 0
    )

    roads_covered = len(summary)

    road_summary = []

    for road, s in summary.items():

        avg_speed = round(
            s["total_speed"] / s["readings"],
            1,
        )

        if s["high_count"] >= 5:
            status = "High"
        elif s["high_count"] > 0:
            status = "Moderate"
        else:
            status = "Normal"

        road_summary.append(
            {
                "road_name": road,
                "readings": s["readings"],
                "avg_speed": avg_speed,
                "high_congestion_count": s["high_count"],
                "status": status,
            }
        )

    return {
        "period_days": days,

        "statistics": {
            "total_readings": total_readings,
            "accidents": total_accidents,
            "roads_covered": roads_covered,
            "average_speed": average_speed,
        },

        "congestion": congestion_counts,

        "roads": road_summary,
    }


@router.get("/export-csv")
def export_csv(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)

    records = (
        db.query(models.TrafficData)
        .filter(models.TrafficData.recorded_at >= since)
        .all()
    )

    buffer = io.StringIO()

    writer = csv.writer(buffer)

    writer.writerow(
        [
            "road_name",
            "vehicle_count",
            "average_speed",
            "congestion_level",
            "weather",
            "accident",
            "recorded_at",
        ]
    )

    for r in records:
        writer.writerow(
            [
                r.road_name,
                r.vehicle_count,
                r.average_speed,
                r.congestion_level,
                r.weather,
                r.accident,
                r.recorded_at,
            ]
        )

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; filename=traffic_report.csv"
            )
        },
    )
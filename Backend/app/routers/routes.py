from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db, get_current_user
from .. import models

router = APIRouter(prefix="/routes", tags=["Routes"])

CONGESTION_SCORE = {"Low": 1, "Medium": 2, "High": 3}

ROAD_DISTANCE_KM = {
    "NH-24": 22.0,
    "Outer Ring Road": 28.5,
    "Ring Road": 18.0,
    "MG Road": 12.5,
}

ROUTE_OPTIONS = {
    ("Connaught Place", "Noida"): ["NH-24", "Outer Ring Road"],
    ("Connaught Place", "Gurgaon"): ["Ring Road", "MG Road"],
}


@router.get("/recommend")
def recommend_route(origin: str, destination: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    candidates = ROUTE_OPTIONS.get((origin, destination))
    if not candidates:
        raise HTTPException(status_code=404, detail="No known route between these points yet.")

    results = []
    for road in candidates:
        latest = (
            db.query(models.TrafficData)
            .filter(models.TrafficData.road_name == road)
            .order_by(models.TrafficData.id.desc())
            .first()
        )
        congestion = latest.congestion_level if latest else "Medium"
        avg_speed = latest.average_speed if latest else 30.0  
        distance_km = ROAD_DISTANCE_KM.get(road, 15.0)  
        
        safe_speed = max(avg_speed, 5.0)
        travel_time_minutes = round((distance_km / safe_speed) * 60, 1)

        results.append({
            "road_name": road,
            "congestion_level": congestion,
            "score": CONGESTION_SCORE.get(congestion, 2),
            "distance_km": distance_km,
            "average_speed": avg_speed,
            "estimated_travel_time_minutes": travel_time_minutes,
        })

    results.sort(key=lambda r: r["score"])
    for i, r in enumerate(results):
        r["recommended"] = (i == 0)

    return {"origin": origin, "destination": destination, "routes": results}

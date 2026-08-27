from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db, get_current_user
from .. import models
from ..ml_loader import ml_bundle

router = APIRouter(prefix="/routes", tags=["Routes"])


# ---------------------------------------------------------
# Existing route information
# ---------------------------------------------------------

CONGESTION_SCORE = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
}

ROAD_DISTANCE_KM = {
    "NH-24": 22.0,
    "Outer Ring Road": 28.5,
    "Ring Road": 18.0,
    "MG Road": 12.5,
}

ROUTE_OPTIONS = {
    ("Noida", "Connaught Place"): [
        "NH-24",
        "Outer Ring Road",
    ],

    ("Noida", "Gurgaon"): [
        "Outer Ring Road",
        "Ring Road",
    ],

    ("Noida", "Ghaziabad"): [
        "NH-24",
        "Outer Ring Road",
    ],

    ("Noida", "Greater Noida"): [
        "NH-24",
        "Outer Ring Road",
    ],

    ("Noida", "South Delhi"): [
        "Outer Ring Road",
        "Ring Road",
    ],
}


# ---------------------------------------------------------
# AI prediction helper
# ---------------------------------------------------------

def predict_congestion(
    traffic_volume: int,
    average_speed: float,
    hour: int,
    day_of_week: int,
    city_zone: str,
    road_type: str,
    weather: str,
    accident: bool,
):
    """
    Uses the existing Random Forest model to predict
    congestion for a route.
    """

    if ml_bundle is None:
        raise HTTPException(
            status_code=503,
            detail="AI prediction model is not loaded."
        )

    model = ml_bundle["model"]

    city_zone_encoder = ml_bundle["city_zone_encoder"]
    road_type_encoder = ml_bundle["road_type_encoder"]
    weather_encoder = ml_bundle["weather_encoder"]
    features = ml_bundle["features"]

    try:
        city_zone_encoded = city_zone_encoder.transform(
            [city_zone]
        )[0]

        road_type_encoded = road_type_encoder.transform(
            [road_type]
        )[0]

        weather_encoded = weather_encoder.transform(
            [weather]
        )[0]

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid AI input category: {str(e)}"
        )

    row = [[
        traffic_volume,
        average_speed,
        hour,
        day_of_week,
        city_zone_encoded,
        road_type_encoded,
        weather_encoded,
        1 if accident else 0,
    ]]

    import pandas as pd

    dataframe = pd.DataFrame(
        row,
        columns=[
            "traffic_volume",
            "average_speed_kmph",
            "hour",
            "day_of_week",
            "city_zone_encoded",
            "road_type_encoded",
            "weather_encoded",
            "accident_encoded",
        ],
    )[features]

    prediction = model.predict(dataframe)[0]

    probabilities = model.predict_proba(dataframe)[0]

    probability_map = dict(
        zip(model.classes_, probabilities)
    )

    confidence = float(
        probability_map[prediction]
    )

    return prediction, confidence, {
        key: float(value)
        for key, value in probability_map.items()
    }


# ---------------------------------------------------------
# AI-powered alternate route recommendation
# ---------------------------------------------------------

@router.get("/recommend")
def recommend_route(
    origin: str,
    destination: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    candidates = ROUTE_OPTIONS.get(
        (origin, destination)
    )

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail="No known route between these points yet."
        )

    results = []

    for road in candidates:

        # Get latest traffic information
        latest = (
            db.query(models.TrafficData)
            .filter(
                models.TrafficData.road_name == road
            )
            .order_by(
                models.TrafficData.id.desc()
            )
            .first()
        )

        # Use database traffic data
        if latest:

            traffic_volume = latest.vehicle_count
            average_speed = latest.average_speed
            weather = latest.weather
            accident = latest.accident

        # If there is no traffic record,
        # use reasonable fallback values
        else:

            traffic_volume = 100
            average_speed = 30.0
            weather = "Clear"
            accident = False

        # Current time information
        from datetime import datetime

        now = datetime.now()

        hour = now.hour
        day_of_week = now.weekday()

        # -------------------------------------------------
        # AI prediction
        # -------------------------------------------------

        predicted_congestion, confidence, probabilities = (
            predict_congestion(
                traffic_volume=traffic_volume,
                average_speed=average_speed,
                hour=hour,
                day_of_week=day_of_week,
                city_zone="Downtown",
                road_type="Main Road",
                weather=weather,
                accident=accident,
            )
        )

        # -------------------------------------------------
        # Travel time calculation
        # -------------------------------------------------

        distance_km = ROAD_DISTANCE_KM.get(
            road,
            15.0
        )

        safe_speed = max(
            average_speed,
            5.0
        )

        travel_time_minutes = round(
            (distance_km / safe_speed) * 60,
            1
        )

        # -------------------------------------------------
        # Store result
        # -------------------------------------------------

        results.append({
            "road_name": road,
            "congestion_level": predicted_congestion,
            "confidence": round(confidence, 3),
            "probabilities": probabilities,
            "distance_km": distance_km,
            "average_speed": average_speed,
            "estimated_travel_time_minutes": travel_time_minutes,
            "traffic_volume": traffic_volume,
            "weather": weather,
            "accident": accident,
        })

    # -----------------------------------------------------
    # Recommendation logic
    # -----------------------------------------------------

    results.sort(
        key=lambda route: (
            CONGESTION_SCORE.get(
                route["congestion_level"],
                2
            ),
            route["estimated_travel_time_minutes"],
        )
    )

    for index, route in enumerate(results):

        route["recommended"] = index == 0

    return {
        "origin": origin,
        "destination": destination,
        "recommendation": results[0]["road_name"],
        "routes": results,
    }
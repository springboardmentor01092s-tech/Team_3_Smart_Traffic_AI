"""
Loads the trained traffic prediction model bundle once, at import time,
so any router can import `ml_bundle` from here without a circular
dependency on main.py.

Expects a single joblib-dumped dict saved at app/ml/model_bundle.pkl
with keys: "model", "city_zone_encoder", "road_type_encoder",
"weather_encoder", "features" (a list of column names in the order
the model was trained on) — matching what routers/prediction.py expects.

If your .pkl is named differently or split into multiple files, update
MODEL_PATH (and the loading logic, if needed) below.
"""

from pathlib import Path
import joblib

MODEL_PATH = Path(__file__).parent / "ml" / "model_bundle.pkl"

try:
    ml_bundle = joblib.load(MODEL_PATH)
except FileNotFoundError:
    ml_bundle = None
    print(f"[WARNING] ML model not found at {MODEL_PATH}. "
          f"/prediction/predict will not work until it's added.")

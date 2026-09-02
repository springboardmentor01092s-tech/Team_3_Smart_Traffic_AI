import { useState } from "react";
import api from "../services/api";
import Layout from "../components/admin/Layout";
import OperatorLayout from "../components/OperatorLayout";
import CommuterLayout from "../components/CommuterLayout";
import "../styles/prediction.css";

const DAYS = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 1 },
  { label: "Wednesday", value: 2 },
  { label: "Thursday", value: 3 },
  { label: "Friday", value: 4 },
  { label: "Saturday", value: 5 },
  { label: "Sunday", value: 6 },
];

// These must exactly match the categories the ML model's LabelEncoders
// were trained on (Backend/app/ml/model_bundle.pkl). Free-text input here
// causes a 400 "Unrecognized category" error from /prediction/predict.
const CITY_ZONES = [
  "Commercial",
  "Downtown",
  "Industrial",
  "Residential",
  "Suburban",
];
const ROAD_TYPES = ["Highway", "Local Road", "Main Road"];

// Shared prediction form & result — all logic preserved exactly as-is
function PredictionContent() {
  const [form, setForm] = useState({
    traffic_volume: 100,
    average_speed_kmph: 30,
    hour: 9,
    day_of_week: 0,
    city_zone: "Downtown",
    road_type: "Highway",
    weather_condition: "Clear",
    accident_reported: false,
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);

  const [origin] = useState("Noida");
  const [destination, setDestination] = useState("Connaught Place");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.post("/prediction/predict", {
        ...form,
        traffic_volume: Number(form.traffic_volume),
        average_speed_kmph: Number(form.average_speed_kmph),
        hour: Number(form.hour),
        day_of_week: Number(form.day_of_week),
      });
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Prediction failed. Please check your inputs.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleRouteRecommendation = async () => {
    setRouteLoading(true);
    setRouteError("");
    setRouteResult(null);

    try {
      const res = await api.get("/routes/recommend", {
        params: {
          origin,
          destination,
        },
      });

      setRouteResult(res.data);
    } catch (err) {
      setRouteError(
        err.response?.data?.detail || "Unable to get AI route recommendation.",
      );
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="prediction-page">
      <h1>Congestion Prediction</h1>
      <p>
        Enter road and traffic conditions to get an AI-predicted congestion
        level.
      </p>

      <form onSubmit={handleSubmit} className="prediction-form">
        <label>
          Traffic Volume
          <input
            type="number"
            name="traffic_volume"
            value={form.traffic_volume}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Average Speed (km/h)
          <input
            type="number"
            step="0.1"
            name="average_speed_kmph"
            value={form.average_speed_kmph}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Hour (0–23)
          <input
            type="number"
            min="0"
            max="23"
            name="hour"
            value={form.hour}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Day of Week
          <select
            name="day_of_week"
            value={form.day_of_week}
            onChange={handleChange}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          City Zone
          <select
            name="city_zone"
            value={form.city_zone}
            onChange={handleChange}
            required
          >
            {CITY_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>

        <label>
          Road Type
          <select
            name="road_type"
            value={form.road_type}
            onChange={handleChange}
            required
          >
            {ROAD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Weather Condition
          <select
            name="weather_condition"
            value={form.weather_condition}
            onChange={handleChange}
          >
            <option value="Clear">Clear</option>
            <option value="Rain">Rain</option>
            <option value="Fog">Fog</option>
            <option value="Storm">Storm</option>
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="accident_reported"
            checked={form.accident_reported}
            onChange={handleChange}
          />
          Accident Reported
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict Congestion"}
        </button>
      </form>

      {error && <p className="prediction-error">{error}</p>}
      <div className="route-recommendation">
        <h2>AI Route Recommendation</h2>
        <p>
          Compare available routes using live traffic conditions, AI congestion
          prediction and estimated travel time.
        </p>

        <div className="route-form">
          <label>
            Origin
            <select value={origin} disabled>
              <option value="Noida">Noida</option>
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="Connaught Place">Connaught Place</option>
              <option value="Gurgaon">Gurgaon</option>
              <option value="Ghaziabad">Ghaziabad</option>
              <option value="Greater Noida">Greater Noida</option>
              <option value="South Delhi">South Delhi</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleRouteRecommendation}
            disabled={routeLoading}
          >
            {routeLoading ? "Analyzing Routes..." : "Get AI Recommendation"}
          </button>
        </div>

        {routeError && <p className="prediction-error">{routeError}</p>}

        {routeResult && (
          <div className="route-result">
            <h3>🧠 AI Recommended Route: {routeResult.recommendation}</h3>

            <div className="route-cards">
              {routeResult.routes.map((route) => (
                <div
                  key={route.road_name}
                  className={`route-card ${
                    route.recommended ? "recommended-route" : ""
                  }`}
                >
                  {route.recommended && <strong>✓ AI RECOMMENDED</strong>}

                  <h4>{route.road_name}</h4>

                  <p>
                    Congestion: <b>{route.congestion_level}</b>
                  </p>

                  <p>
                    AI Confidence: <b>{(route.confidence * 100).toFixed(1)}%</b>
                  </p>

                  <p>
                    Distance: <b>{route.distance_km} km</b>
                  </p>

                  <p>
                    Average Speed: <b>{route.average_speed} km/h</b>
                  </p>

                  <p>
                    Estimated Travel Time:{" "}
                    <b>{route.estimated_travel_time_minutes} minutes</b>
                  </p>

                  <p>
                    Weather: <b>{route.weather}</b>
                  </p>

                  <p>
                    Accident: <b>{route.accident ? "Yes" : "No"}</b>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div
          className={`prediction-result level-${result.predicted_congestion?.toLowerCase()}`}
        >
          <h2>Predicted Congestion: {result.predicted_congestion}</h2>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <div className="probabilities">
            {Object.entries(result.probabilities).map(([level, prob]) => (
              <div key={level} className="prob-row">
                <span>{level}</span>
                <div className="prob-bar">
                  <div
                    className="prob-fill"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span>{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Role-aware wrapper — same pattern as LiveMap.jsx
export default function Prediction() {
  const userRole = localStorage.getItem("role") || "commuter";

  if (userRole === "admin") {
    return (
      <Layout>
        <PredictionContent />
      </Layout>
    );
  }

  if (userRole === "operator") {
    return (
      <OperatorLayout title="AI Traffic Prediction Center">
        <PredictionContent />
      </OperatorLayout>
    );
  }

  // Commuter/User — full commuter layout
  return (
    <CommuterLayout>
      <PredictionContent />
    </CommuterLayout>
  );
}

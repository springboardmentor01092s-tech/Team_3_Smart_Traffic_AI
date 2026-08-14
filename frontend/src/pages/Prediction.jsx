import { useState } from "react";
import api from "../services/api";
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

export default function Prediction() {
  const [form, setForm] = useState({
    traffic_volume: 100,
    average_speed_kmph: 30,
    hour: 9,
    day_of_week: 0,
    city_zone: "",
    road_type: "",
    weather_condition: "Clear",
    accident_reported: false,
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        err.response?.data?.detail || "Prediction failed. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-page">
      <h1>Congestion Prediction</h1>
      <p>Enter road and traffic conditions to get an AI-predicted congestion level.</p>

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
          <select name="day_of_week" value={form.day_of_week} onChange={handleChange}>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>

        <label>
          City Zone
          <input
            type="text"
            name="city_zone"
            placeholder="e.g. Central Delhi"
            value={form.city_zone}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Road Type
          <input
            type="text"
            name="road_type"
            placeholder="e.g. Highway"
            value={form.road_type}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Weather Condition
          <select name="weather_condition" value={form.weather_condition} onChange={handleChange}>
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

      {result && (
        <div className={`prediction-result level-${result.predicted_congestion?.toLowerCase()}`}>
          <h2>Predicted Congestion: {result.predicted_congestion}</h2>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          <div className="probabilities">
            {Object.entries(result.probabilities).map(([level, prob]) => (
              <div key={level} className="prob-row">
                <span>{level}</span>
                <div className="prob-bar">
                  <div className="prob-fill" style={{ width: `${prob * 100}%` }} />
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

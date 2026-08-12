import { useEffect, useState } from "react";
import api from "../services/api";
import TrafficMap from "../components/TrafficMap";
import "../styles/liveMap.css";

export default function LiveMap() {
  const [liveData, setLiveData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLiveData = async () => {
    try {
      const res = await api.get("/traffic/live");
      setLiveData(res.data);
      setError("");
    } catch (err) {
      setError("Could not load live traffic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-map-page">
      <div className="live-map-header">
        <h1>Live Traffic Map</h1>
        <p>Real-time congestion by road, refreshed every 15 seconds.</p>
      </div>

      {loading && <p>Loading live traffic data...</p>}
      {error && <p className="live-map-error">{error}</p>}

      {!loading && !error && liveData.length === 0 && (
        <p>No traffic data has been ingested yet.</p>
      )}

      {!loading && liveData.length > 0 && <TrafficMap liveData={liveData} />}

      <div className="live-map-legend">
        <span><i className="dot low" /> Low</span>
        <span><i className="dot medium" /> Medium</span>
        <span><i className="dot high" /> High</span>
      </div>
    </div>
  );
}

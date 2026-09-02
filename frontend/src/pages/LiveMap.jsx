import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Activity,
  Camera,
  AlertTriangle,
  TrendingUp,
  Zap,
  Info
} from "lucide-react";
import api from "../services/api";
import TrafficMap, { ROAD_COORDINATES } from "../components/TrafficMap";
import GlassCard from "../components/admin/GlassCard";
import Layout from "../components/admin/Layout";
import OperatorLayout from "../components/OperatorLayout";
import CommuterLayout from "../components/CommuterLayout";
import "../styles/liveMap.css";

export default function LiveMap() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // Filter States
  const [selectedRoad, setSelectedRoad] = useState("All Roads");
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [selectedTime, setSelectedTime] = useState("Live / Now");

  // Get Role from localStorage
  const userRole = localStorage.getItem("role") || "commuter";

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

  // Base Data Source (Live data or map defaults if empty)
  const baseData = liveData.length > 0 ? liveData : [
    { road_name: "NH-24", average_speed: 45, congestion_level: "Medium", weather: "Clear", accident: false, recorded_at: new Date().toISOString() },
    { road_name: "Ring Road", average_speed: 28, congestion_level: "High", weather: "Clear", accident: true, recorded_at: new Date().toISOString() },
    { road_name: "MG Road", average_speed: 62, congestion_level: "Low", weather: "Sunny", accident: false, recorded_at: new Date().toISOString() },
    { road_name: "Outer Ring Road", average_speed: 52, congestion_level: "Low", weather: "Clear", accident: false, recorded_at: new Date().toISOString() }
  ];

  // Dynamic Options derived from data & road config
  const roadOptions = Array.from(
    new Set([...Object.keys(ROAD_COORDINATES), ...baseData.map(r => r.road_name)])
  );

  const areaOptions = Array.from(
    new Set(Object.values(ROAD_COORDINATES).map(c => c.area).filter(Boolean))
  );

  // Multi-level Filtering (Road, Area, Time)
  let filteredData = baseData;

  if (selectedRoad !== "All Roads") {
    filteredData = filteredData.filter(r => r.road_name === selectedRoad);
  }

  if (selectedArea !== "All Areas") {
    filteredData = filteredData.filter(
      r => ROAD_COORDINATES[r.road_name]?.area === selectedArea
    );
  }

  if (selectedTime !== "Live / Now") {
    const now = new Date();
    const minutesCutoff = selectedTime === "Last 15 Mins" ? 15 : 60;
    filteredData = filteredData.filter(r => {
      if (!r.recorded_at) return true;
      const recordTime = new Date(r.recorded_at);
      const diffMinutes = (now - recordTime) / (1000 * 60);
      return isNaN(diffMinutes) || diffMinutes <= minutesCutoff;
    });
  }

  // Derived Insights based strictly on filteredData
  const avgSpeed = filteredData.length > 0
    ? Math.round(filteredData.reduce((acc, curr) => acc + curr.average_speed, 0) / filteredData.length)
    : 0;

  const hasHigh = filteredData.some(r => r.congestion_level === "High");
  const hasMedium = filteredData.some(r => r.congestion_level === "Medium");
  const overallCongestion = filteredData.length === 0 ? "N/A" : (hasHigh ? "HIGH" : (hasMedium ? "MEDIUM" : "LOW"));
  const overallStatus = filteredData.length === 0 ? "No Active Data" : (hasHigh ? "Heavy Traffic" : (hasMedium ? "Moderate Traffic" : "Clear / Flowing"));

  const camerasOnline = `${filteredData.length} / ${baseData.length}`;

  const highCongestionZones = filteredData.filter(r => r.congestion_level === "High" || r.accident).length;

  let mostCongestedRoad = "None";
  const highRoads = filteredData.filter(r => r.congestion_level === "High");
  const medRoads = filteredData.filter(r => r.congestion_level === "Medium");
  if (highRoads.length > 0) {
    mostCongestedRoad = highRoads[0].road_name;
  } else if (medRoads.length > 0) {
    mostCongestedRoad = medRoads[0].road_name;
  } else if (filteredData.length > 0) {
    mostCongestedRoad = filteredData[0].road_name;
  }

  // Dynamic Summary Text
  const getTrafficSummary = () => {
    if (filteredData.length === 0) return "No traffic data matches the selected filters.";
    const highList = filteredData.filter(r => r.congestion_level === "High").map(r => r.road_name);
    const incidents = filteredData.filter(r => r.accident).map(r => r.road_name);

    let summary = `Average speed across selected filter is ${avgSpeed} km/h.`;
    if (highList.length > 0) {
      summary += ` Heavy congestion on ${highList.join(", ")}.`;
    }
    if (incidents.length > 0) {
      summary += ` ⚠️ Incident reported on ${incidents.join(", ")}.`;
    }
    return summary;
  };

  // Shared Page Content
  const renderContent = () => (
    <div className="live-traffic-dashboard">
      <div className="live-map-header">
        <h1>LIVE TRAFFIC</h1>
        <p>Real-time traffic monitoring</p>
      </div>

      {/* FILTER / CONTROL BAR */}
      <div className="filter-control-bar">
        <div className="filters-left">
          <div className="filter-select-wrapper">
            <select
              value={selectedRoad}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="filter-select"
            >
              <option value="All Roads">All Roads</option>
              {roadOptions.map((road) => (
                <option key={road} value={road}>{road}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="filter-select"
            >
              <option value="All Areas">All Areas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="filter-select"
            >
              <option value="Live / Now">Live / Now</option>
              <option value="Last 15 Mins">Last 15 Mins</option>
              <option value="Last 1 Hour">Last 1 Hour</option>
            </select>
          </div>
        </div>

        <div className="legend-right">
          <span className="legend-label">Traffic Status:</span>
          <span className="legend-item"><i className="legend-dot low" /> Low</span>
          <span className="legend-item"><i className="legend-dot medium" /> Medium</span>
          <span className="legend-item"><i className="legend-dot high" /> High</span>
        </div>
      </div>

      {/* GRID: MAP (70-75%) and INSIGHTS (25-30%) */}
      <div className="live-traffic-grid">
        <div className="map-panel">
          <GlassCard className="map-glass-card">
            {loading && <p className="loading-text">Loading live traffic map...</p>}
            {error && <p className="live-map-error">{error}</p>}
            {/* Map always renders regardless of backend data availability */}
            <TrafficMap
              liveData={filteredData}
              selectedRoadFilter={selectedRoad}
              selectedAreaFilter={selectedArea}
              height="100%"
            />
          </GlassCard>
        </div>

        <div className="insights-panel">
          <div className="insights-header">
            <h2>Traffic Insights</h2>
          </div>

          <div className="insight-cards-grid">
            <div className="compact-insight-card">
              <div className="insight-icon"><Car size={18} color="#00ff95" /></div>
              <div className="insight-details">
                <span className="insight-label">Avg Speed</span>
                <span className="insight-value">{avgSpeed} km/h</span>
              </div>
            </div>

            <div className="compact-insight-card">
              <div className="insight-icon"><Activity size={18} color="#ffae00" /></div>
              <div className="insight-details">
                <span className="insight-label">Congestion</span>
                <span className="insight-value">{overallCongestion}</span>
              </div>
            </div>

            <div className="compact-insight-card">
              <div className="insight-icon"><Camera size={18} color="#00d4ff" /></div>
              <div className="insight-details">
                <span className="insight-label">Cameras</span>
                <span className="insight-value">{camerasOnline}</span>
              </div>
            </div>

            <div className="compact-insight-card">
              <div className="insight-icon"><AlertTriangle size={18} color="#ff5f5f" /></div>
              <div className="insight-details">
                <span className="insight-label">Incidents</span>
                <span className="insight-value">{highCongestionZones > 0 ? `${highCongestionZones} Zone` : "None"}</span>
              </div>
            </div>

            <div className="compact-insight-card">
              <div className="insight-icon"><TrendingUp size={18} color="#00ff95" /></div>
              <div className="insight-details">
                <span className="insight-label">Most Congested</span>
                <span className="insight-value">{mostCongestedRoad}</span>
              </div>
            </div>

            <div className="compact-insight-card">
              <div className="insight-icon"><Zap size={18} color="#00d4ff" /></div>
              <div className="insight-details">
                <span className="insight-label">Traffic Status</span>
                <span className="insight-value">{overallStatus}</span>
              </div>
            </div>
          </div>

          {/* Traffic Summary */}
          {liveData.length > 0 && (
            <div className="traffic-summary-box">
              <div className="summary-title-row">
                <Info size={16} color="#00d4ff" />
                <h3>Traffic Summary</h3>
              </div>
              <p>{getTrafficSummary()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap based on user role to match the role layout exactly
  if (userRole === "admin") {
    return <Layout>{renderContent()}</Layout>;
  }

  if (userRole === "operator") {
    return (
      <OperatorLayout title="Live Traffic Operations Map">
        {renderContent()}
      </OperatorLayout>
    );
  }

  // default to commuter role / layout
  return <CommuterLayout>{renderContent()}</CommuterLayout>;
}

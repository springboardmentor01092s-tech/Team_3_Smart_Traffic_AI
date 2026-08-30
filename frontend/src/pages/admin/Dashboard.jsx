import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/admin/Layout";
import StatCard from "../../components/admin/StatCard";
import GlassCard from "../../components/admin/GlassCard";
import TrafficMap from "../../components/TrafficMap";
import api from "../../services/api";

import {
  Camera,
  Activity,
  Car,
  TriangleAlert,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  MapPinned,
  Signal,
  Shield,
  Navigation,
  CheckCircle2
} from "lucide-react";

import "../../styles/admin/cards.css";
import "../../styles/admin/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await api.get("/traffic/live");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setLiveData(res.data);
        }
      } catch (err) {
        console.error("Could not load live traffic data for dashboard map:", err);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, []);

  const alerts = [
    { road: "NH-44", severity: "High", status: "Accident reported at 5:15 PM" },
    { road: "Anna Salai", severity: "Medium", status: "Heavy Traffic slow moving" },
    { road: "Bypass Road", severity: "Low", status: "Road Work active lane" }
  ];

  const hotspots = [
    { road: "NH-24 Corridor", speed: "45 km/h", level: "Medium" },
    { road: "Ring Road Express", speed: "28 km/h", level: "High" },
    { road: "MG Road Central", speed: "62 km/h", level: "Low" },
    { road: "Outer Ring Road", speed: "52 km/h", level: "Low" }
  ];

  return (
    <Layout>
      <div className="dashboard">
        {/* KPI Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Active Cameras"
            value="128"
            change="12 Today"
            icon={<Camera />}
            color="#00F5D4"
          />
          <StatCard
            title="Traffic Flow"
            value="93%"
            change="5%"
            icon={<Activity />}
            color="#8B5CF6"
          />
          <StatCard
            title="Vehicles Count"
            value="18.2K"
            change="845"
            icon={<Car />}
            color="#FF9B2F"
          />
          <StatCard
            title="Incidents"
            value="16"
            change="2"
            icon={<TriangleAlert />}
            color="#FF5C7A"
          />
        </div>

        {/* Main 2-Column Dashboard Command Center Grid */}
        <div className="dashboard-grid">
          {/* Left Main Column */}
          <div className="left-column">
            {/* Live Traffic Map Glass Card using working Google Map Component */}
            <GlassCard className="map-card">
              <div className="card-header">
                <h2>
                  <MapPinned />
                  Live Traffic Map
                </h2>
                <div className="map-header-right">
                  <div className="legend-pills">
                    <span className="legend-pill">
                      <i className="legend-dot low" /> Low
                    </span>
                    <span className="legend-pill">
                      <i className="legend-dot medium" /> Medium
                    </span>
                    <span className="legend-pill">
                      <i className="legend-dot high" /> High
                    </span>
                  </div>
                  <button onClick={() => navigate("/admin/live-traffic")}>
                    View Live
                  </button>
                </div>
              </div>

              {/* Verified Working Google Maps Traffic Component */}
              <TrafficMap liveData={liveData} height="280px" />
            </GlassCard>

            {/* Traffic Health & System Overview */}
            <GlassCard className="health-card">
              <div className="card-header">
                <h2>
                  <CheckCircle2 />
                  Command Center System Health
                </h2>
              </div>
              <div className="system-health-grid">
                <div className="health-mini-card">
                  <div className="health-icon">
                    <Activity size={16} color="#00F5D4" />
                  </div>
                  <div className="health-details">
                    <span className="health-label">Flow Efficiency</span>
                    <span className="health-val">93.4% Optimal</span>
                  </div>
                </div>
                <div className="health-mini-card">
                  <div className="health-icon">
                    <Signal size={16} color="#00d4ff" />
                  </div>
                  <div className="health-details">
                    <span className="health-label">Active Signals</span>
                    <span className="health-val">124 Synchronized</span>
                  </div>
                </div>
                <div className="health-mini-card">
                  <div className="health-icon">
                    <Camera size={16} color="#00ff9d" />
                  </div>
                  <div className="health-details">
                    <span className="health-label">AI Feeds</span>
                    <span className="health-val">52 Live Feeds</span>
                  </div>
                </div>
                <div className="health-mini-card">
                  <div className="health-icon">
                    <Shield size={16} color="#ffc400" />
                  </div>
                  <div className="health-details">
                    <span className="health-label">Emergency Units</span>
                    <span className="health-val">17 Units Ready</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Traffic Trend Card */}
            <GlassCard className="trend-card">
              <div className="card-header">
                <h2>
                  <TrendingUp />
                  Peak Traffic Flow Trend
                </h2>
              </div>
              <div className="trend-placeholder">
                <div className="bar one"></div>
                <div className="bar two"></div>
                <div className="bar three"></div>
                <div className="bar four"></div>
                <div className="bar five"></div>
                <div className="bar six"></div>
                <div className="bar seven"></div>
              </div>
            </GlassCard>
          </div>

          {/* Right Secondary Column */}
          <div className="right-column">
            {/* Road Congestion Hotspots */}
            <GlassCard className="hotspots-card">
              <div className="card-header">
                <h2>
                  <Navigation />
                  Corridor Status
                </h2>
              </div>
              <div className="hotspot-list">
                {hotspots.map((item, idx) => (
                  <div className="hotspot-item" key={idx}>
                    <span className="hotspot-road">{item.road}</span>
                    <span className="hotspot-speed">{item.speed}</span>
                    <span className={`hotspot-badge ${item.level}`}>
                      {item.level}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recent Alerts Card */}
            <GlassCard className="alerts-card">
              <div className="card-header">
                <h2>
                  <TriangleAlert />
                  Recent Alerts
                </h2>
              </div>

              {alerts.map((item, index) => (
                <div className="alert-item" key={index}>
                  <div>
                    <h4>{item.road}</h4>
                    <p>{item.status}</p>
                  </div>
                  <span>{item.severity}</span>
                </div>
              ))}
            </GlassCard>

            {/* AI Insights Card */}
            <GlassCard className="insight-card">
              <div className="card-header">
                <h2>
                  <BrainCircuit />
                  AI Traffic Recommendations
                </h2>
              </div>

              <div className="insight-box">
                <ShieldCheck />
                <h3>Congestion Prediction</h3>
                <p>
                  AI predicts heavy volume on NH-44 from 5PM to 7PM. Signal timing auto-optimization recommended.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
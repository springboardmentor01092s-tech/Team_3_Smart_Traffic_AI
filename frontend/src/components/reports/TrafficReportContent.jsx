import { useState } from "react";
import {
  Download,
  FileText,
  RefreshCw,
  Activity,
  AlertTriangle,
  Car,
  Gauge,
  MapPin,
  Search,
  Filter,
  Info,
  CloudSun,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import useLiveTrafficReport from "../../hooks/useLiveTrafficReport";
import "../../styles/reports.css";

export default function TrafficReportContent({ theme = "admin" }) {
  const {
    liveData,
    incidentsList,
    loading,
    error,
    lastUpdated,
    stats,
    fetchLiveData,
    handleDownloadIncidentReport,
    handleExportCSV,
    handleExportPDF,
  } = useLiveTrafficReport();

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  // Multi-level filtering for Incidents & Reports Table
  const filteredIncidents = incidentsList.filter((item) => {
    const matchesSearch =
      item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alert_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      severityFilter === "All" ||
      item.severity.toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  // Recharts color palette by theme
  const getCongestionColor = (level) => {
    if (level === "High") return "#ff5c72";
    if (level === "Medium") return "#ffae00";
    return "#00ff95";
  };

  return (
    <div className={`traffic-reports-container reports-theme-${theme}`}>
      {/* HEADER SECTION */}
      <div className="reports-top-bar">
        <div className="reports-title-area">
          <div className="badge-live">
            <span className="live-pulse" /> REAL INCIDENTS & TRAFFIC TELEMETRY
          </div>
          <h1>
            {theme === "admin"
              ? "ADMIN INCIDENT & TRAFFIC REPORTS"
              : theme === "operator"
              ? "OPERATIONAL INCIDENT REPORTS"
              : "COMMUTER TRAFFIC INCIDENT REPORTS"}
          </h1>
          <p>
            Official traffic incident reports, active hazards, and road telemetry logs. Download individual PDF incident reports instantly.
          </p>
        </div>

        <div className="reports-actions">
          {lastUpdated && (
            <span className="last-updated-text">
              <Clock size={14} /> Live Sync: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            className="btn-report-action btn-refresh"
            onClick={fetchLiveData}
            title="Refresh Live Data"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>

          <button
            className="btn-report-action btn-export-csv"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={16} />
            <span>Export All CSV</span>
          </button>

          <button
            className="btn-report-action btn-export-pdf"
            onClick={handleExportPDF}
            title="Export Summary PDF"
          >
            <FileText size={16} />
            <span>Export Summary PDF</span>
          </button>
        </div>
      </div>

      {/* ERROR & LOADING STATES */}
      {loading && liveData.length === 0 && incidentsList.length === 0 ? (
        <div className="reports-card reports-state-card">
          <RefreshCw size={32} className="spin-animation color-accent" />
          <h3>Loading Real Incident & Traffic Reports...</h3>
          <p>Fetching active telemetry from /alerts/ and /traffic/live endpoints</p>
        </div>
      ) : error ? (
        <div className="reports-card reports-state-card reports-error-card">
          <AlertTriangle size={36} />
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button className="btn-report-action btn-refresh" onClick={fetchLiveData}>
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* KPI STAT CARDS GRID */}
          <div className="reports-stats-grid">
            <div className="reports-stat-card">
              <div className="stat-icon-wrapper color-incidents">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Active Incidents</span>
                <strong className="stat-value">{stats.accidents}</strong>
                <span className="stat-subtext">Requires attention</span>
              </div>
            </div>

            <div className="reports-stat-card">
              <div className="stat-icon-wrapper color-speed">
                <Gauge size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Average Network Speed</span>
                <strong className="stat-value">{stats.averageSpeed} <small>km/h</small></strong>
                <span className="stat-subtext">Live corridor telemetry</span>
              </div>
            </div>

            <div className="reports-stat-card">
              <div className="stat-icon-wrapper color-vehicles">
                <Car size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Traffic Volume</span>
                <strong className="stat-value">{stats.totalVehicles.toLocaleString()}</strong>
                <span className="stat-subtext">Monitored vehicles</span>
              </div>
            </div>

            <div className="reports-stat-card">
              <div className="stat-icon-wrapper color-roads">
                <MapPin size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Monitored Roads</span>
                <strong className="stat-value">{stats.roadsCovered}</strong>
                <span className="stat-subtext">Live sensors active</span>
              </div>
            </div>
          </div>

          {/* ==================================================================
              MAIN PRIORITY #1: INCIDENT & TELEMETRY REPORTS TABLE (ABOVE THE FOLD)
             ================================================================== */}
          <div className="reports-card table-card priority-reports-card">
            <div className="reports-card-header flex-header">
              <div>
                <h2>
                  <ShieldAlert size={20} /> Traffic Incident & Road Telemetry Reports
                </h2>
                <span className="card-subtitle">
                  Immediate access to real incidents with dedicated individual report download actions.
                </span>
              </div>

              {/* FILTER & SEARCH CONTROLS */}
              <div className="table-controls-inline">
                <div className="search-input-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search incident or road..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-select-group">
                  <Filter size={15} className="filter-icon" />
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                  >
                    <option value="All">All Severities</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="reports-state-card">
                <Info size={28} />
                <p>No incidents match your current search or severity filter.</p>
              </div>
            ) : (
              <div className="reports-table-wrapper">
                <table className="reports-table priority-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Incident Type</th>
                      <th>Location / Road</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Traffic Speed</th>
                      <th>Volume</th>
                      <th>Time Reported</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((incident) => (
                      <tr key={incident.id}>
                        <td className="font-mono text-xs">{incident.id}</td>
                        <td className="font-semibold">
                          <span className="incident-type-pill">
                            <AlertTriangle size={13} /> {incident.alert_type}
                          </span>
                        </td>
                        <td className="font-medium road-cell">
                          <MapPin size={14} className="cell-icon" />
                          {incident.location}
                        </td>
                        <td>
                          <span
                            className={`badge-severity ${incident.severity.toLowerCase()}`}
                          >
                            {incident.severity}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge-status ${incident.status.toLowerCase()}`}
                          >
                            {incident.status}
                          </span>
                        </td>
                        <td>{incident.average_speed} km/h</td>
                        <td>{incident.vehicle_count} veh</td>
                        <td className="text-muted text-xs">
                          {new Date(incident.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn-download-incident"
                            onClick={() => handleDownloadIncidentReport(incident)}
                            title={`Download official report for ${incident.id}`}
                          >
                            <Download size={13} /> Download Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ==================================================================
              SECONDARY SECTION: CONGESTION SUMMARY & ROAD VEHICLE DENSITY (BELOW THE FOLD)
             ================================================================== */}
          <div className="secondary-analytics-title">
            <h3>Secondary Traffic Analytics & Density Trends</h3>
          </div>

          <div className="reports-charts-grid">
            {/* CONGESTION BREAKDOWN & INSIGHTS */}
            <div className="reports-card overview-card">
              <div className="reports-card-header">
                <h2>
                  <Info size={18} /> Network Congestion Breakdown
                </h2>
                <span className="card-subtitle">Real-time corridor classification</span>
              </div>

              <div className="congestion-breakdown-list">
                <div className="congestion-bar-item">
                  <div className="congestion-info">
                    <span className="label low">Low Congestion</span>
                    <strong>{stats.congestion.Low} Roads</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill low"
                      style={{
                        width: `${stats.totalReadings > 0 ? (stats.congestion.Low / stats.totalReadings) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="congestion-bar-item">
                  <div className="congestion-info">
                    <span className="label medium">Medium Congestion</span>
                    <strong>{stats.congestion.Medium} Roads</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill medium"
                      style={{
                        width: `${stats.totalReadings > 0 ? (stats.congestion.Medium / stats.totalReadings) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="congestion-bar-item">
                  <div className="congestion-info">
                    <span className="label high">High Congestion</span>
                    <strong>{stats.congestion.High} Roads</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill high"
                      style={{
                        width: `${stats.totalReadings > 0 ? (stats.congestion.High / stats.totalReadings) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="insights-mini-box">
                <div className="insight-row">
                  <CloudSun size={18} className="insight-icon" />
                  <div>
                    <span className="mini-title">Weather Distribution</span>
                    <span className="mini-val">
                      {Object.entries(stats.weatherCounts)
                        .map(([w, cnt]) => `${w}: ${cnt}`)
                        .join(" | ") || "Clear"}
                    </span>
                  </div>
                </div>

                <div className="insight-row">
                  <Activity size={18} className="insight-icon" />
                  <div>
                    <span className="mini-title">Most Congested Corridor</span>
                    <span className="mini-val highlight">{stats.mostCongestedRoad}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* REORGANIZED BAR CHART: ROAD VEHICLE DENSITY (MOVED BELOW REPORTS) */}
            <div className="reports-card chart-card secondary-chart-card">
              <div className="reports-card-header">
                <h2>
                  <Activity size={18} /> Road Vehicle Density (Corridor Volume)
                </h2>
                <span className="card-subtitle">Secondary analytics & vehicle count</span>
              </div>

              {liveData.length > 0 ? (
                <div className="chart-container" style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={liveData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis
                        dataKey="road_name"
                        stroke="#94a3b8"
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          color: "#f8fafc",
                        }}
                      />
                      <Bar dataKey="vehicle_count" radius={[6, 6, 0, 0]}>
                        {liveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCongestionColor(entry.congestion_level)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="reports-empty-chart">No live telemetry available for vehicle density chart</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

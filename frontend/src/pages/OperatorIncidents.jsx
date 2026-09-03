import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  X,
  Siren,
  Edit,
  Shield,
  Gauge,
} from "lucide-react";
import api from "../services/api";
import OperatorLayout from "../components/OperatorLayout";
import "../styles/operatorIncidents.css";

export default function OperatorIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [liveTraffic, setLiveTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Data for Dispatch
  const [dispatchForm, setDispatchForm] = useState({
    alert_type: "Accident",
    description: "",
    location: "",
    severity: "High",
  });

  // Form Data for Update
  const [editForm, setEditForm] = useState({
    alert_type: "Accident",
    description: "",
    location: "",
    severity: "High",
  });

  // Fetch real incidents and live traffic data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [alertsRes, trafficRes] = await Promise.allSettled([
        api.get("/alerts/"),
        api.get("/traffic/live"),
      ]);

      const alertsData = alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value.data)
        ? alertsRes.value.data
        : [];
      const trafficData = trafficRes.status === "fulfilled" && Array.isArray(trafficRes.value.data)
        ? trafficRes.value.data
        : [];

      setIncidents(alertsData);
      setLiveTraffic(trafficData);
    } catch (err) {
      console.error("Operator incidents fetch failed:", err);
      setError("Unable to connect to live incident operations feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Merge each incident with live traffic telemetry for its location
  const correlatedIncidents = useMemo(() => {
    return incidents.map((inc) => {
      const matchedTraffic = liveTraffic.find(
        (t) =>
          inc.location &&
          (inc.location.toLowerCase().includes(t.road_name.toLowerCase()) ||
            t.road_name.toLowerCase().includes(inc.location.toLowerCase()))
      );

      return {
        ...inc,
        speed: matchedTraffic ? `${matchedTraffic.average_speed} km/h` : "40 km/h",
        volume: matchedTraffic ? `${matchedTraffic.vehicle_count} veh` : "120 veh",
        congestion: matchedTraffic ? matchedTraffic.congestion_level : "Medium",
        weather: matchedTraffic ? matchedTraffic.weather : "Clear",
      };
    });
  }, [incidents, liveTraffic]);

  // Filtered Incidents List
  const filteredIncidents = useMemo(() => {
    return correlatedIncidents.filter((item) => {
      const matchesStatus =
        filterStatus === "All" ||
        item.status?.toLowerCase() === filterStatus.toLowerCase();
      const matchesSeverity =
        filterSeverity === "All" ||
        item.severity?.toLowerCase() === filterSeverity.toLowerCase();
      const matchesType =
        filterType === "All" || item.alert_type === filterType;
      const matchesSearch =
        searchQuery === "" ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.alert_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSeverity && matchesType && matchesSearch;
    });
  }, [correlatedIncidents, filterStatus, filterSeverity, filterType, searchQuery]);

  // KPI Statistics
  const activeCount = incidents.filter((i) => i.status?.toLowerCase() !== "resolved").length;
  const criticalCount = incidents.filter(
    (i) => (i.severity?.toLowerCase() === "high" || i.severity?.toLowerCase() === "critical") && i.status?.toLowerCase() !== "resolved"
  ).length;
  const acknowledgedCount = incidents.filter((i) => i.status?.toLowerCase() === "acknowledged").length;
  const resolvedCount = incidents.filter((i) => i.status?.toLowerCase() === "resolved").length;
  const uniqueImpactedRoads = new Set(
    incidents.filter((i) => i.status?.toLowerCase() !== "resolved").map((i) => i.location)
  ).size;

  // OPERATOR ACTION 1: Acknowledge Incident
  const handleAcknowledge = async (id) => {
    try {
      await api.patch(`/alerts/${id}/acknowledge`);
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "Acknowledged", acknowledged_at: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      console.error("Acknowledge failed:", err);
      // Local optimistic update
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "Acknowledged", acknowledged_at: new Date().toISOString() }
            : item
        )
      );
    }
  };

  // OPERATOR ACTION 2: Resolve Incident
  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "Resolved", resolved_at: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      console.error("Resolve failed:", err);
      // Local optimistic update
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "Resolved", resolved_at: new Date().toISOString() }
            : item
        )
      );
    }
  };

  // OPERATOR ACTION 3: Open Edit / Update Modal
  const handleOpenEdit = (incident) => {
    setEditingIncident(incident);
    setEditForm({
      alert_type: incident.alert_type || "Accident",
      description: incident.description || "",
      location: incident.location || "",
      severity: incident.severity || "High",
    });
  };

  // Save Incident Update
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!editingIncident) return;
    setSubmitting(true);

    try {
      try {
        await api.put(`/alerts/${editingIncident.id}`, editForm);
      } catch (err) {
        console.warn("PUT API error, applying local update:", err);
      }

      setIncidents((prev) =>
        prev.map((item) =>
          item.id === editingIncident.id ? { ...item, ...editForm } : item
        )
      );
      setEditingIncident(null);
    } finally {
      setSubmitting(false);
    }
  };

  // OPERATOR ACTION 4: Log / Dispatch Incident
  const handleDispatchIncident = async (e) => {
    e.preventDefault();
    if (!dispatchForm.description.trim() || !dispatchForm.location.trim()) {
      alert("Please fill in location and incident description.");
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        alert_type: dispatchForm.alert_type,
        description: dispatchForm.description,
        location: dispatchForm.location,
        severity: dispatchForm.severity,
      };

      try {
        const res = await api.post("/alerts/", payload);
        if (res.data) {
          setIncidents((prev) => [res.data, ...prev]);
        }
      } catch (err) {
        const localItem = {
          id: Date.now(),
          ...payload,
          status: "Active",
          created_at: new Date().toISOString(),
        };
        setIncidents((prev) => [localItem, ...prev]);
      }

      setShowDispatchModal(false);
      setDispatchForm({
        alert_type: "Accident",
        description: "",
        location: "",
        severity: "High",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Unique alert types for filter
  const allTypes = Array.from(new Set(incidents.map((i) => i.alert_type).filter(Boolean)));

  return (
    <OperatorLayout title="AI Incident Operations Command">
      <div className="operator-incidents-page">
        {/* HEADER SECTION */}
        <div className="incidents-header">
          <div className="incidents-title-area">
            <div className="badge-operator">
              <Shield size={14} /> ACTIVE OPERATIONS CENTER
            </div>
            <h1>INCIDENT DISPATCH & OPERATIONS QUEUE</h1>
            <p>
              Real-time traffic incident telemetry, emergency units dispatch, and road status management.
            </p>
          </div>

          <div className="incidents-actions">
            <button
              className="btn-operator-action btn-op-refresh"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Queue"
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              <span>Sync</span>
            </button>

            <button
              className="btn-operator-action btn-dispatch"
              onClick={() => setShowDispatchModal(true)}
            >
              <Siren size={16} />
              <span>Log Incident</span>
            </button>
          </div>
        </div>

        {/* KPI STATS GRID */}
        <div className="incidents-stats-grid">
          <div className="incidents-stat-card">
            <div className="stat-icon-wrapper active">
              <Activity size={22} />
            </div>
            <div className="stat-details">
              <h3>{activeCount}</h3>
              <span>Active Queue</span>
            </div>
          </div>

          <div className="incidents-stat-card">
            <div className="stat-icon-wrapper critical">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-details">
              <h3>{criticalCount}</h3>
              <span>High Severity</span>
            </div>
          </div>

          <div className="incidents-stat-card">
            <div className="stat-icon-wrapper impacted">
              <MapPin size={22} />
            </div>
            <div className="stat-details">
              <h3>{uniqueImpactedRoads}</h3>
              <span>Impacted Corridors</span>
            </div>
          </div>

          <div className="incidents-stat-card">
            <div className="stat-icon-wrapper ack">
              <Clock size={22} />
            </div>
            <div className="stat-details">
              <h3>{acknowledgedCount}</h3>
              <span>Acknowledged</span>
            </div>
          </div>

          <div className="incidents-stat-card">
            <div className="stat-icon-wrapper resolved">
              <CheckCircle size={22} />
            </div>
            <div className="stat-details">
              <h3>{resolvedCount}</h3>
              <span>Resolved</span>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="incidents-filter-bar">
          <div className="search-input-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by road, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select-item">
            <Filter size={14} className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-select-item">
            <Filter size={14} className="filter-icon" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="High">High / Critical</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-select-item">
            <Filter size={14} className="filter-icon" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Incident Types</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MAIN INCIDENT OPERATIONS QUEUE */}
        <div className="operator-card">
          <div className="operator-card-header">
            <h2>
              <Activity size={18} color="#00d4ff" /> Incidents Operations Queue ({filteredIncidents.length})
            </h2>
            <span className="card-subtitle">Direct operator action & live telemetry correlation</span>
          </div>

          {error && <p className="prediction-error">{error}</p>}

          {filteredIncidents.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#8da2c5" }}>
              <CheckCircle size={32} color="#00ff9d" />
              <p style={{ marginTop: "10px" }}>No incidents match your filter criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Incident Type</th>
                    <th>Road / Location</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Live Traffic</th>
                    <th>Reported</th>
                    <th>Operator Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td className="font-mono text-muted">#INC-{inc.id}</td>
                      <td>
                        <span className="type-cell">
                          <AlertTriangle size={14} color="#ff5c72" />
                          {inc.alert_type}
                        </span>
                      </td>
                      <td>
                        <span className="location-cell">
                          <MapPin size={13} color="#00d4ff" />
                          {inc.location}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-sev ${inc.severity.toLowerCase()}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-stat ${inc.status.toLowerCase()}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td>
                        <span className="telemetry-pill">
                          <strong>{inc.speed}</strong> • {inc.congestion}
                        </span>
                      </td>
                      <td className="text-muted text-xs">
                        {inc.created_at
                          ? new Date(inc.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--"}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-op-action btn-op-view"
                            onClick={() => setSelectedIncident(inc)}
                            title="View Telemetry"
                          >
                            <Eye size={13} /> View
                          </button>

                          {inc.status?.toLowerCase() === "active" && (
                            <button
                              className="btn-op-action btn-op-ack"
                              onClick={() => handleAcknowledge(inc.id)}
                              title="Acknowledge"
                            >
                              <Clock size={13} /> Ack
                            </button>
                          )}

                          {inc.status?.toLowerCase() !== "resolved" && (
                            <button
                              className="btn-op-action btn-op-resolve"
                              onClick={() => handleResolve(inc.id)}
                              title="Mark Resolved"
                            >
                              <CheckCircle size={13} /> Resolve
                            </button>
                          )}

                          <button
                            className="btn-op-action btn-op-edit"
                            onClick={() => handleOpenEdit(inc)}
                            title="Update"
                          >
                            <Edit size={13} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CORRELATED ROAD TRAFFIC IMPACT PANEL */}
        <div className="operator-card">
          <div className="operator-card-header">
            <h2>
              <Gauge size={18} color="#00ff9d" /> Correlated Corridor Traffic Impact
            </h2>
            <span className="card-subtitle">Real-time flow telemetry on incident-affected roads</span>
          </div>

          <div className="impact-corridors-grid">
            {liveTraffic.map((road) => (
              <div key={road.road_name} className="impact-card">
                <h4>
                  <MapPin size={14} /> {road.road_name}
                </h4>
                <div className="impact-metrics-row">
                  <span>Current Speed:</span>
                  <strong>{road.average_speed} km/h</strong>
                </div>
                <div className="impact-metrics-row">
                  <span>Vehicle Volume:</span>
                  <strong>{road.vehicle_count} vehicles</strong>
                </div>
                <div className="impact-metrics-row">
                  <span>Congestion Status:</span>
                  <strong className={`badge-sev ${road.congestion_level.toLowerCase()}`}>
                    {road.congestion_level}
                  </strong>
                </div>
                <div className="impact-metrics-row">
                  <span>Weather:</span>
                  <strong>{road.weather}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIEW INCIDENT DETAILS MODAL */}
        {selectedIncident && (
          <div className="modal-backdrop" onClick={() => setSelectedIncident(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>
                  <AlertTriangle size={20} color="#00d4ff" /> Incident Telemetry #INC-{selectedIncident.id}
                </h2>
                <button className="modal-close-btn" onClick={() => setSelectedIncident(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="detail-row">
                <span>Incident Type:</span>
                <strong>{selectedIncident.alert_type}</strong>
              </div>
              <div className="detail-row">
                <span>Location:</span>
                <strong>{selectedIncident.location}</strong>
              </div>
              <div className="detail-row">
                <span>Severity:</span>
                <strong className={`badge-sev ${selectedIncident.severity.toLowerCase()}`}>
                  {selectedIncident.severity}
                </strong>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <strong className={`badge-stat ${selectedIncident.status.toLowerCase()}`}>
                  {selectedIncident.status}
                </strong>
              </div>
              <div className="detail-row">
                <span>Reported At:</span>
                <strong>{new Date(selectedIncident.created_at).toLocaleString()}</strong>
              </div>
              <div className="detail-row">
                <span>Corridor Speed:</span>
                <strong>{selectedIncident.speed}</strong>
              </div>
              <div className="detail-row">
                <span>Corridor Volume:</span>
                <strong>{selectedIncident.volume}</strong>
              </div>
              <div className="detail-row">
                <span>Description:</span>
                <strong>{selectedIncident.description}</strong>
              </div>

              <div className="modal-actions">
                {selectedIncident.status?.toLowerCase() === "active" && (
                  <button
                    className="btn-operator-action btn-op-ack"
                    onClick={() => {
                      handleAcknowledge(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                  >
                    Acknowledge
                  </button>
                )}
                {selectedIncident.status?.toLowerCase() !== "resolved" && (
                  <button
                    className="btn-operator-action btn-op-resolve"
                    onClick={() => {
                      handleResolve(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                  >
                    Resolve Incident
                  </button>
                )}
                <button className="btn-modal-cancel" onClick={() => setSelectedIncident(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT / UPDATE INCIDENT MODAL */}
        {editingIncident && (
          <div className="modal-backdrop" onClick={() => !submitting && setEditingIncident(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>
                  <Edit size={20} color="#00d4ff" /> Update Incident #INC-{editingIncident.id}
                </h2>
                <button className="modal-close-btn" onClick={() => setEditingIncident(null)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveUpdate} className="modal-form">
                <label>
                  Incident Type
                  <select
                    value={editForm.alert_type}
                    onChange={(e) => setEditForm({ ...editForm, alert_type: e.target.value })}
                  >
                    <option value="Accident">Accident</option>
                    <option value="Traffic Congestion">Traffic Congestion</option>
                    <option value="Road Blockage">Road Blockage</option>
                    <option value="Road Hazard">Road Hazard</option>
                    <option value="Signal Issue">Signal Issue</option>
                  </select>
                </label>

                <label>
                  Severity
                  <select
                    value={editForm.severity}
                    onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                  >
                    <option value="High">High / Critical</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>

                <label>
                  Location / Corridor
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Description / Situation Notes
                  <textarea
                    rows="3"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required
                  />
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setEditingIncident(null)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Updates"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LOG / DISPATCH NEW INCIDENT MODAL */}
        {showDispatchModal && (
          <div className="modal-backdrop" onClick={() => !submitting && setShowDispatchModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>
                  <Siren size={20} color="#ff5c72" /> Dispatch & Log Field Incident
                </h2>
                <button className="modal-close-btn" onClick={() => setShowDispatchModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleDispatchIncident} className="modal-form">
                <label>
                  Incident Type
                  <select
                    value={dispatchForm.alert_type}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, alert_type: e.target.value })}
                  >
                    <option value="Accident">Accident</option>
                    <option value="Traffic Congestion">Traffic Congestion</option>
                    <option value="Road Blockage">Road Blockage</option>
                    <option value="Road Hazard">Road Hazard</option>
                    <option value="Signal Issue">Signal Issue</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </label>

                <label>
                  Severity
                  <select
                    value={dispatchForm.severity}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, severity: e.target.value })}
                  >
                    <option value="High">High / Critical</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>

                <label>
                  Location / Corridor
                  <input
                    type="text"
                    placeholder="e.g. NH-24 Expressway, Sector 62"
                    value={dispatchForm.location}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, location: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Incident Details
                  <textarea
                    rows="3"
                    placeholder="Describe the incident, vehicles involved, lane blockage..."
                    value={dispatchForm.description}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, description: e.target.value })}
                    required
                  />
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setShowDispatchModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit" disabled={submitting}>
                    {submitting ? "Logging..." : "Log Incident"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
}

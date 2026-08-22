import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  MapPin,
  X,
  Siren,
  Clock,
  Filter,
} from "lucide-react";

import api from "../services/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState(null);

  // =========================================================
  // FILTER STATES
  // =========================================================

  const [filterType, setFilterType] = useState("All");
  const [filterRoad, setFilterRoad] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] = useState({
    alert_type: "Accident",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    severity: "Medium",
  });

  // =========================================================
  // GET CURRENT USER ROLE
  // =========================================================

  const getRole = () => {
    const role = localStorage.getItem("role");

    if (!role) {
      return "";
    }

    return role.toLowerCase();
  };

  const role = getRole();

  const canManageAlerts =
    role === "admin" || role === "operator";

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  const normalizeStatus = (status) => {
    return status?.toLowerCase() || "";
  };

  // =========================================================
  // FETCH ALERTS
  // =========================================================

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/alerts/");

      setAlerts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);

      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE ALERT
  // =========================================================

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert("Please enter alert description.");
      return;
    }

    if (!formData.location.trim()) {
      alert("Please enter alert location.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        alert_type: formData.alert_type,
        description: formData.description,
        location: formData.location,

        latitude:
          formData.latitude === ""
            ? null
            : Number(formData.latitude),

        longitude:
          formData.longitude === ""
            ? null
            : Number(formData.longitude),

        severity: formData.severity,
      };

      await api.post("/alerts/", payload);

      alert("Emergency alert created successfully.");

      setShowModal(false);

      setFormData({
        alert_type: "Accident",
        description: "",
        location: "",
        latitude: "",
        longitude: "",
        severity: "Medium",
      });

      await fetchAlerts();
    } catch (error) {
      console.error("Create alert error:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to create alert."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // ACKNOWLEDGE ALERT
  // =========================================================

  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(
        `/alerts/${alertId}/acknowledge`
      );

      alert("Alert acknowledged.");

      await fetchAlerts();
    } catch (error) {
      console.error("Acknowledge error:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to acknowledge alert."
      );
    }
  };

  // =========================================================
  // RESOLVE ALERT
  // =========================================================

  const handleResolve = async (alertId) => {
    try {
      await api.patch(
        `/alerts/${alertId}/resolve`
      );

      alert("Alert resolved.");

      await fetchAlerts();
    } catch (error) {
      console.error("Resolve error:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to resolve alert."
      );
    }
  };

  // =========================================================
  // VIEW ALERT
  // =========================================================

  const handleView = (alert) => {
    setSelectedAlert(alert);
  };

  // =========================================================
  // UNIQUE FILTER VALUES
  // =========================================================

  const allTypes = [
    ...new Set(
      alerts
        .map((alert) => alert.alert_type)
        .filter(Boolean)
    ),
  ];

  const allRoads = [
    ...new Set(
      alerts
        .map((alert) => alert.location)
        .filter(Boolean)
    ),
  ];

  // =========================================================
  // FILTER ALERTS
  // =========================================================

  const filteredAlerts = alerts.filter((alert) => {
    const typeMatch =
      filterType === "All" ||
      alert.alert_type === filterType;

    const roadMatch =
      filterRoad === "All" ||
      alert.location === filterRoad;

    const severityMatch =
      filterSeverity === "All" ||
      alert.severity?.toLowerCase() ===
        filterSeverity.toLowerCase();

    const statusMatch =
      filterStatus === "All" ||
      normalizeStatus(alert.status) ===
        filterStatus.toLowerCase();

    return (
      typeMatch &&
      roadMatch &&
      severityMatch &&
      statusMatch
    );
  });

  // =========================================================
  // STATISTICS
  // =========================================================

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity?.toLowerCase() === "critical" &&
      normalizeStatus(alert.status) !== "resolved"
  ).length;

  const warningCount = alerts.filter(
    (alert) =>
      alert.severity?.toLowerCase() === "medium" &&
      normalizeStatus(alert.status) !== "resolved"
  ).length;

  const activeCount = alerts.filter(
    (alert) =>
      normalizeStatus(alert.status) !== "resolved"
  ).length;

  const resolvedCount = alerts.filter(
    (alert) =>
      normalizeStatus(alert.status) === "resolved"
  ).length;

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "active":
        return "status-active";

      case "acknowledged":
        return "status-acknowledged";

      case "resolved":
        return "status-resolved";

      default:
        return "";
    }
  };

  // =========================================================
  // SEVERITY CLASS
  // =========================================================

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "severity-critical";

      case "high":
        return "severity-high";

      case "medium":
        return "severity-medium";

      case "low":
        return "severity-low";

      default:
        return "severity-medium";
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="alerts-page">
        <div className="loading">
          Loading traffic alerts...
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="alerts-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="alerts-header">

        <div>
          <h1>TRAFFIC ALERTS</h1>

          <p>
            Real-time traffic incidents and system alerts.
          </p>
        </div>

        {/* RED EMERGENCY BUTTON */}

        <button
          className="emergency-button"
          onClick={() => setShowModal(true)}
        >
          <Siren size={22} />

          <span>
            Report Emergency
          </span>
        </button>

      </div>

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="stats-grid">

        {/* CRITICAL */}

        <div className="stat-card critical-card">

          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2>{criticalCount}</h2>
            <span>CRITICAL</span>
          </div>

        </div>

        {/* WARNINGS */}

        <div className="stat-card warning-card">

          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2>{warningCount}</h2>
            <span>WARNINGS</span>
          </div>

        </div>

        {/* ACTIVE */}

        <div className="stat-card active-card">

          <div className="stat-icon">
            <Clock size={24} />
          </div>

          <div>
            <h2>{activeCount}</h2>
            <span>ACTIVE</span>
          </div>

        </div>

        {/* RESOLVED */}

        <div className="stat-card resolved-card">

          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>

          <div>
            <h2>{resolvedCount}</h2>
            <span>RESOLVED</span>
          </div>

        </div>

      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="alerts-filter-bar">

        <Filter
          size={18}
          className="filter-icon"
        />

        {/* ALL TYPES */}

        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value)
          }
        >
          <option value="All">
            All Types
          </option>

          {allTypes.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>

        {/* ALL ROADS */}

        <select
          value={filterRoad}
          onChange={(e) =>
            setFilterRoad(e.target.value)
          }
        >
          <option value="All">
            All Roads
          </option>

          {allRoads.map((road) => (
            <option
              key={road}
              value={road}
            >
              {road}
            </option>
          ))}
        </select>

        {/* ALL SEVERITY */}

        <select
          value={filterSeverity}
          onChange={(e) =>
            setFilterSeverity(e.target.value)
          }
        >
          <option value="All">
            All Severity
          </option>

          <option value="Critical">
            Critical
          </option>

          <option value="High">
            High
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="Low">
            Low
          </option>
        </select>

        {/* ALL STATUS */}

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value)
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Acknowledged">
            Acknowledged
          </option>

          <option value="Resolved">
            Resolved
          </option>
        </select>

      </div>

      {/* ===================================================
          ALERT LIST
      =================================================== */}

      <div className="alerts-section">

        <div className="section-title">
          ALERTS — {filteredAlerts.length} SHOWING
        </div>

        {filteredAlerts.length === 0 ? (

          <div className="empty-state">
            <CheckCircle size={35} />

            <p>
              No alerts match the selected filters.
            </p>
          </div>

        ) : (

          <div className="alerts-list">

            {filteredAlerts.map((alert) => {

              const severityClass =
                getSeverityClass(
                  alert.severity
                );

              const statusClass =
                getStatusClass(
                  alert.status
                );

              const normalizedStatus =
                normalizeStatus(
                  alert.status
                );

              return (

                <div
                  key={alert.id}
                  className={`alert-card ${severityClass}`}
                >

                  {/* LEFT SIDE */}

                  <div className="alert-main">

                    <div className="alert-icon">

                      <AlertTriangle
                        size={24}
                      />

                    </div>

                    <div className="alert-info">

                      {/* TITLE + BADGES */}

                      <div className="alert-title-row">

                        <h3>
                          {alert.alert_type}
                        </h3>

                        <span
                          className={`severity-badge ${severityClass}`}
                        >
                          {alert.severity}
                        </span>

                        <span
                          className={`status-badge ${statusClass}`}
                        >
                          {alert.status}
                        </span>

                      </div>

                      {/* LOCATION */}

                      <div className="location">

                        <MapPin size={14} />

                        <span>
                          {alert.location}
                        </span>

                      </div>

                      {/* DESCRIPTION */}

                      <p className="description">
                        {alert.description}
                      </p>

                    </div>

                  </div>

                  {/* RIGHT SIDE */}

                  <div className="alert-right">

                    <span className="alert-time">

                      <Clock size={13} />

                      {alert.created_at
                        ? new Date(
                            alert.created_at
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}

                    </span>

                    <div className="alert-actions">

                      {/* VIEW */}

                      <button
                        className="view-button"
                        onClick={() =>
                          handleView(alert)
                        }
                      >
                        <Eye size={16} />
                        View
                      </button>

                      {/* ACKNOWLEDGE */}

                      {canManageAlerts &&
                        normalizedStatus ===
                          "active" && (

                          <button
                            className="acknowledge-button"
                            onClick={() =>
                              handleAcknowledge(
                                alert.id
                              )
                            }
                          >
                            <CheckCircle
                              size={16}
                            />

                            Acknowledge
                          </button>

                        )}

                      {/* RESOLVE */}

                      {canManageAlerts &&
                        normalizedStatus !==
                          "resolved" && (

                          <button
                            className="resolve-button"
                            onClick={() =>
                              handleResolve(
                                alert.id
                              )
                            }
                          >
                            <CheckCircle
                              size={16}
                            />

                            Resolve
                          </button>

                        )}

                    </div>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

      {/* ===================================================
          CREATE EMERGENCY MODAL
      =================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            !submitting &&
            setShowModal(false)
          }
        >

          <div
            className="emergency-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  <Siren size={24} />
                  Report Emergency
                </h2>

                <p>
                  Report a traffic incident or emergency.
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  !submitting &&
                  setShowModal(false)
                }
              >
                <X size={22} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleCreateAlert}
            >

              {/* ALERT TYPE */}

              <div className="form-group">

                <label>
                  Alert Type
                </label>

                <select
                  name="alert_type"
                  value={
                    formData.alert_type
                  }
                  onChange={handleChange}
                >

                  <option value="Accident">
                    Accident
                  </option>

                  <option value="Road Block">
                    Road Block
                  </option>

                  <option value="Traffic Jam">
                    Traffic Jam
                  </option>

                  <option value="Vehicle Breakdown">
                    Vehicle Breakdown
                  </option>

                  <option value="Fire">
                    Fire
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Describe the emergency..."
                  rows="4"
                />

              </div>

              {/* LOCATION */}

              <div className="form-group">

                <label>
                  Location / Road
                </label>

                <input
                  type="text"
                  name="location"
                  value={
                    formData.location
                  }
                  onChange={handleChange}
                  placeholder="Enter location or road"
                />

              </div>

              {/* COORDINATES */}

              <div className="coordinates">

                <div className="form-group">

                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={
                      formData.latitude
                    }
                    onChange={handleChange}
                    placeholder="21.1458"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={
                      formData.longitude
                    }
                    onChange={handleChange}
                    placeholder="79.0882"
                  />

                </div>

              </div>

              {/* SEVERITY */}

              <div className="form-group">

                <label>
                  Severity
                </label>

                <select
                  name="severity"
                  value={
                    formData.severity
                  }
                  onChange={handleChange}
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-emergency-button"
                  disabled={submitting}
                >

                  <Siren size={18} />

                  {submitting
                    ? "Reporting..."
                    : "Report Emergency"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ===================================================
          VIEW ALERT MODAL
      =================================================== */}

      {selectedAlert && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedAlert(null)
          }
        >

          <div
            className="view-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Alert Details
                </h2>

                <p>
                  Alert #{selectedAlert.id}
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedAlert(null)
                }
              >
                <X size={22} />
              </button>

            </div>

            <div className="details">

              <div>
                <strong>
                  Type
                </strong>

                <span>
                  {selectedAlert.alert_type}
                </span>
              </div>

              <div>
                <strong>
                  Description
                </strong>

                <span>
                  {selectedAlert.description}
                </span>
              </div>

              <div>
                <strong>
                  Location
                </strong>

                <span>
                  {selectedAlert.location}
                </span>
              </div>

              <div>
                <strong>
                  Severity
                </strong>

                <span>
                  {selectedAlert.severity}
                </span>
              </div>

              <div>
                <strong>
                  Status
                </strong>

                <span>
                  {selectedAlert.status}
                </span>
              </div>

              <div>
                <strong>
                  Reported By User ID
                </strong>

                <span>
                  {selectedAlert.reported_by}
                </span>
              </div>

              <div>
                <strong>
                  Created At
                </strong>

                <span>
                  {selectedAlert.created_at
                    ? new Date(
                        selectedAlert.created_at
                      ).toLocaleString()
                    : "-"}
                </span>
              </div>

              {selectedAlert.acknowledged_at && (
                <div>
                  <strong>
                    Acknowledged At
                  </strong>

                  <span>
                    {new Date(
                      selectedAlert.acknowledged_at
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {selectedAlert.resolved_at && (
                <div>
                  <strong>
                    Resolved At
                  </strong>

                  <span>
                    {new Date(
                      selectedAlert.resolved_at
                    ).toLocaleString()}
                  </span>
                </div>
              )}

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          PAGE STYLES
      =================================================== */}

      <style>{`

        .alerts-page {
          padding: 28px;
          min-height: 100vh;
          color: white;
        }

        /* HEADER */

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .alerts-header h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
        }

        .alerts-header p {
          margin-top: 7px;
          color: #9caec2;
        }

        /* RED EMERGENCY BUTTON */

        .emergency-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          border: none;
          border-radius: 10px;

          padding: 15px 25px;

          background: linear-gradient(
            135deg,
            #ff1f35,
            #ef172d
          );

          color: white;

          font-size: 16px;
          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 0 20px
            rgba(255, 31, 53, 0.45);

          transition: all 0.2s ease;
        }

        .emergency-button:hover {
          transform: translateY(-2px);

          background: linear-gradient(
            135deg,
            #ff3448,
            #ff142b
          );

          box-shadow:
            0 0 30px
            rgba(255, 31, 53, 0.65);
        }

        /* STATS */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);

          gap: 18px;

          margin-bottom: 20px;
        }

        .stat-card {
          display: flex;
          align-items: center;

          gap: 15px;

          padding: 20px;

          border-radius: 15px;

          background:
            rgba(5, 20, 40, 0.75);

          border:
            1px solid
            rgba(100, 180, 255, 0.12);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 45px;
          height: 45px;

          border-radius: 10px;
        }

        .stat-card h2 {
          margin: 0;
          font-size: 27px;
        }

        .stat-card span {
          font-size: 12px;
          color: #9db0c5;
        }

        .critical-card .stat-icon {
          color: #ff3348;
          background:
            rgba(255, 50, 70, 0.1);
        }

        .warning-card .stat-icon {
          color: #ffc400;
          background:
            rgba(255, 196, 0, 0.1);
        }

        .active-card .stat-icon {
          color: #00d9ff;
          background:
            rgba(0, 217, 255, 0.1);
        }

        .resolved-card .stat-icon {
          color: #00ed8a;
          background:
            rgba(0, 237, 138, 0.1);
        }

        /* FILTER BAR */

        .alerts-filter-bar {
          display: flex;
          align-items: center;

          gap: 12px;

          margin-bottom: 25px;

          padding: 14px 16px;

          border-radius: 14px;

          background:
            rgba(5, 20, 40, 0.75);

          border:
            1px solid
            rgba(100, 180, 255, 0.12);
        }

        .filter-icon {
          color: #8da2c5;
          flex-shrink: 0;
        }

        .alerts-filter-bar select {
          min-width: 150px;

          padding: 11px 35px 11px 13px;

          border-radius: 8px;

          border:
            1px solid
            rgba(100, 180, 255, 0.15);

          background: #07172b;

          color: white;

          font-size: 13px;

          cursor: pointer;

          outline: none;
        }

        .alerts-filter-bar select:hover {
          border-color: #00d9ff;
        }

        .alerts-filter-bar select:focus {
          border-color: #00d9ff;

          box-shadow:
            0 0 8px
            rgba(0, 217, 255, 0.2);
        }

        .alerts-filter-bar option {
          background: #07172b;
          color: white;
        }

        /* ALERT SECTION */

        .alerts-section {
          margin-top: 15px;
        }

        .section-title {
          margin-bottom: 15px;

          font-size: 14px;

          font-weight: 700;

          color: #9eb1c6;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;

          gap: 12px;
        }

        /* ALERT CARD */

        .alert-card {
          display: flex;

          justify-content: space-between;
          align-items: center;

          gap: 20px;

          padding: 18px 20px;

          border-radius: 15px;

          background:
            rgba(5, 20, 40, 0.75);

          border:
            1px solid
            rgba(100, 180, 255, 0.12);

          border-left:
            4px solid #00bfff;
        }

        .alert-card.severity-critical {
          border-left-color: #ff3045;
        }

        .alert-card.severity-high {
          border-left-color: #ff8a00;
        }

        .alert-card.severity-medium {
          border-left-color: #ffc400;
        }

        .alert-card.severity-low {
          border-left-color: #00d9ff;
        }

        .alert-main {
          display: flex;

          gap: 15px;

          align-items: center;

          min-width: 0;
        }

        .alert-icon {
          display: flex;

          align-items: center;
          justify-content: center;

          min-width: 50px;
          height: 50px;

          border-radius: 50%;

          color: #ff4050;

          background:
            rgba(255, 50, 70, 0.12);
        }

        .alert-info {
          min-width: 0;
        }

        .alert-info h3 {
          margin: 0;

          font-size: 17px;
        }

        .alert-title-row {
          display: flex;

          align-items: center;

          flex-wrap: wrap;

          gap: 8px;

          margin-bottom: 7px;
        }

        .location {
          display: flex;

          align-items: center;

          gap: 5px;

          color: #cbd6e3;

          font-size: 13px;
        }

        .description {
          margin: 6px 0 0;

          color: #8fa2b7;

          font-size: 13px;
        }

        /* BADGES */

        .severity-badge,
        .status-badge {
          padding: 4px 8px;

          border-radius: 6px;

          font-size: 10px;

          font-weight: 800;

          text-transform: uppercase;
        }

        .severity-badge.severity-critical {
          color: #ff4557;

          background:
            rgba(255, 50, 70, 0.12);
        }

        .severity-badge.severity-high {
          color: #ff9d24;

          background:
            rgba(255, 157, 36, 0.12);
        }

        .severity-badge.severity-medium {
          color: #ffc400;

          background:
            rgba(255, 196, 0, 0.12);
        }

        .severity-badge.severity-low {
          color: #00d9ff;

          background:
            rgba(0, 217, 255, 0.12);
        }

        .status-active {
          color: #00d9ff;

          background:
            rgba(0, 217, 255, 0.1);
        }

        .status-acknowledged {
          color: #a66cff;

          background:
            rgba(166, 108, 255, 0.12);
        }

        .status-resolved {
          color: #00ed8a;

          background:
            rgba(0, 237, 138, 0.1);
        }

        /* RIGHT SIDE */

        .alert-right {
          display: flex;

          align-items: center;

          gap: 15px;

          flex-shrink: 0;
        }

        .alert-time {
          display: flex;

          align-items: center;

          gap: 5px;

          color: #899bad;

          font-size: 12px;

          white-space: nowrap;
        }

        .alert-actions {
          display: flex;

          align-items: center;

          gap: 10px;
        }

        .alert-actions button {
          display: flex;

          align-items: center;

          gap: 6px;

          padding: 9px 13px;

          border-radius: 8px;

          background: transparent;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          transition: 0.2s;
        }

        /* VIEW */

        .view-button {
          border:
            1px solid #008bd1;

          color: #00bfff;
        }

        .view-button:hover {
          background:
            rgba(0, 191, 255, 0.1);
        }

        /* ACKNOWLEDGE */

        .acknowledge-button {
          border:
            1px solid #d39a00;

          color: #ffc400;
        }

        .acknowledge-button:hover {
          background:
            rgba(255, 196, 0, 0.1);
        }

        /* RESOLVE */

        .resolve-button {
          border:
            1px solid #00a970;

          color: #00ed8a;
        }

        .resolve-button:hover {
          background:
            rgba(0, 237, 138, 0.1);
        }

        /* EMPTY */

        .empty-state {
          padding: 50px;

          text-align: center;

          color: #91a4b9;

          background:
            rgba(5, 20, 40, 0.5);

          border-radius: 15px;
        }

        .empty-state svg {
          color: #00ed8a;
        }

        /* LOADING */

        .loading {
          padding: 50px;

          text-align: center;

          color: #91a4b9;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;

          inset: 0;

          z-index: 9999;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            rgba(0, 0, 0, 0.75);

          backdrop-filter: blur(5px);

          padding: 20px;
        }

        .emergency-modal,
        .view-modal {
          width: 100%;

          max-width: 600px;

          max-height: 90vh;

          overflow-y: auto;

          border-radius: 18px;

          background: #071629;

          border:
            1px solid
            rgba(0, 217, 255, 0.2);

          box-shadow:
            0 20px 70px
            rgba(0, 0, 0, 0.6);

          padding: 25px;
        }

        .modal-header {
          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          margin-bottom: 25px;
        }

        .modal-header h2 {
          display: flex;

          align-items: center;

          gap: 9px;

          margin: 0;
        }

        .modal-header p {
          color: #8fa2b7;

          margin-top: 6px;
        }

        .close-button {
          border: none;

          background: transparent;

          color: #9db0c5;

          cursor: pointer;
        }

        .close-button:hover {
          color: white;
        }

        /* FORM */

        .form-group {
          display: flex;

          flex-direction: column;

          gap: 7px;

          margin-bottom: 17px;
        }

        .form-group label {
          color: #d5dfeb;

          font-size: 13px;

          font-weight: 700;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;

          box-sizing: border-box;

          padding: 12px;

          border-radius: 8px;

          border:
            1px solid #243a55;

          background: #0b1d32;

          color: white;

          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #00cfff;
        }

        .coordinates {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 15px;
        }

        .modal-actions {
          display: flex;

          justify-content: flex-end;

          gap: 12px;

          margin-top: 25px;
        }

        .cancel-button {
          padding: 11px 20px;

          border-radius: 8px;

          border:
            1px solid #394b60;

          background: transparent;

          color: #bdc9d6;

          cursor: pointer;
        }

        .cancel-button:disabled {
          opacity: 0.5;

          cursor: not-allowed;
        }

        .submit-emergency-button {
          display: flex;

          align-items: center;

          gap: 8px;

          padding: 11px 20px;

          border: none;

          border-radius: 8px;

          background: #f52238;

          color: white;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 0 18px
            rgba(245, 34, 56, 0.3);
        }

        .submit-emergency-button:hover {
          background: #ff3046;
        }

        .submit-emergency-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }

        /* DETAILS */

        .details {
          display: flex;

          flex-direction: column;

          gap: 15px;
        }

        .details > div {
          display: flex;

          flex-direction: column;

          gap: 5px;

          padding-bottom: 12px;

          border-bottom:
            1px solid
            rgba(255,255,255,0.08);
        }

        .details strong {
          color: #8297ae;

          font-size: 12px;

          text-transform: uppercase;
        }

        .details span {
          color: white;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .alert-card {
            flex-direction: column;

            align-items: flex-start;
          }

          .alert-right {
            width: 100%;

            justify-content: space-between;

            flex-wrap: wrap;
          }

        }

        @media (max-width: 800px) {

          .alerts-filter-bar {
            flex-wrap: wrap;
          }

          .alerts-filter-bar select {
            flex: 1;

            min-width: 140px;
          }

        }

        @media (max-width: 600px) {

          .alerts-page {
            padding: 15px;
          }

          .alerts-header {
            flex-direction: column;

            align-items: flex-start;

            gap: 20px;
          }

          .emergency-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .coordinates {
            grid-template-columns: 1fr;
          }

          .alert-right {
            flex-direction: column;

            align-items: flex-start;
          }

          .alert-actions {
            flex-wrap: wrap;
          }

        }

      `}</style>

    </div>
  );
};

export default Alerts;
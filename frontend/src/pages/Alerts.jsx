import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Zap,
  Camera,
  Navigation,
  Activity,
  Clock,
  Eye,
  BellOff,
  UserCheck,
  CheckCheck,
  Filter,
} from "lucide-react";

import Layout from "../components/admin/Layout";
import OperatorSidebar from "../components/OperatorSidebar";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import UserMenu from "../components/UserMenu";

import api from "../services/api";
import "../styles/alerts.css";

// ============================================================
// ROLE CATEGORIES
// ============================================================

const ADMIN_CATEGORIES = ["traffic", "system", "operational"];
const OPERATOR_CATEGORIES = ["traffic", "operational", "system"];
const COMMUTER_CATEGORIES = ["traffic"];

// ============================================================
// BACKEND ALERT -> FRONTEND ALERT
// ============================================================

function transformAlert(alert) {
  const severityMap = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Critical: "high",
  };

  const statusMap = {
    Active: "active",
    Acknowledged: "acknowledged",
    Resolved: "resolved",
  };

  return {
    id: alert.id,

    type: alert.alert_type,

    severity:
      severityMap[alert.severity] || "medium",

    backendSeverity: alert.severity,

    road: alert.location,

    camera: null,
    speed: null,
    volume: null,

    message: alert.description,

    status:
      statusMap[alert.status] || "active",

    backendStatus: alert.status,

    time: new Date(
      alert.created_at
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),

    category: "traffic",

    latitude: alert.latitude,
    longitude: alert.longitude,

    reportedBy: alert.reported_by,

    acknowledgedAt:
      alert.acknowledged_at,

    resolvedAt:
      alert.resolved_at,
  };
}

// ============================================================
// HELPERS
// ============================================================

function sevClass(sev) {
  return `sev-${sev}`;
}

function badgeClass(sev) {
  return `badge-${sev}`;
}

function SeverityIcon({
  sev,
  size = 16,
}) {
  if (sev === "high") {
    return (
      <AlertCircle
        size={size}
        color="#f87171"
      />
    );
  }

  if (sev === "medium") {
    return (
      <AlertTriangle
        size={size}
        color="#fbbf24"
      />
    );
  }

  if (sev === "low") {
    return (
      <CheckCircle
        size={size}
        color="#4ade80"
      />
    );
  }

  return (
    <Info
      size={size}
      color="#95a9c8"
    />
  );
}

function StatusPill({ status }) {
  const map = {
    active: {
      cls: "status-active",
      label: "Active",
    },

    acknowledged: {
      cls: "status-acknowledged",
      label: "Acknowledged",
    },

    resolved: {
      cls: "status-resolved",
      label: "Resolved",
    },
  };

  const s = map[status] || map.active;

  return (
    <span
      className={`alert-status-pill ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ============================================================
// ALERT DETAILS MODAL
// ============================================================

function AlertModal({
  alert,
  role,
  onClose,
  onAck,
  onResolve,
  onDismiss,
}) {
  if (!alert) return null;

  const canManage =
    role === "admin" ||
    role === "operator";

  return (
    <div
      className="alert-modal-overlay"
      onClick={onClose}
    >
      <div
        className="alert-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h2>Alert Details</h2>

        <div className="alert-modal-row">
          <span className="modal-label">
            Type
          </span>

          <span className="modal-value">
            {alert.type}
          </span>
        </div>

        <div className="alert-modal-row">
          <span className="modal-label">
            Severity
          </span>

          <span className="modal-value">
            {alert.backendSeverity ||
              alert.severity}
          </span>
        </div>

        <div className="alert-modal-row">
          <span className="modal-label">
            Location
          </span>

          <span className="modal-value">
            {alert.road}
          </span>
        </div>

        <div className="alert-modal-row">
          <span className="modal-label">
            Status
          </span>

          <span className="modal-value">
            {alert.backendStatus ||
              alert.status}
          </span>
        </div>

        <div className="alert-modal-row">
          <span className="modal-label">
            Reported
          </span>

          <span className="modal-value">
            {alert.time}
          </span>
        </div>

        {alert.latitude != null &&
          alert.longitude != null && (
            <div className="alert-modal-row">
              <span className="modal-label">
                Coordinates
              </span>

              <span className="modal-value">
                {alert.latitude},{" "}
                {alert.longitude}
              </span>
            </div>
          )}

        <div className="alert-modal-row">
          <span className="modal-label">
            Reported By
          </span>

          <span className="modal-value">
            User #{alert.reportedBy}
          </span>
        </div>

        <div className="alert-modal-desc">
          {alert.message}
        </div>

        <div className="alert-modal-actions">

          {canManage &&
            alert.status ===
              "active" && (
              <button
                className="btn-alert btn-alert-ack"
                onClick={() => {
                  onAck(alert.id);
                  onClose();
                }}
              >
                <UserCheck size={13} />
                Acknowledge
              </button>
            )}

          {canManage &&
            alert.status !==
              "resolved" && (
              <button
                className="btn-alert btn-alert-resolve"
                onClick={() => {
                  onResolve(alert.id);
                  onClose();
                }}
              >
                <CheckCheck size={13} />
                Resolve
              </button>
            )}

          {role === "commuter" && (
            <button
              className="btn-alert btn-alert-dismiss"
              onClick={() => {
                onDismiss(alert.id);
                onClose();
              }}
            >
              <BellOff size={13} />
              Dismiss
            </button>
          )}

          <button
            className="btn-modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REPORT EMERGENCY MODAL
// ALL ROLES CAN USE THIS
// ============================================================

function ReportEmergencyModal({
  form,
  setForm,
  onSubmit,
  onClose,
  reporting,
}) {
  return (
    <div
      className="alert-modal-overlay"
      onClick={onClose}
    >
      <div
        className="alert-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h2>Report Emergency</h2>

        <form onSubmit={onSubmit}>

          {/* ALERT TYPE */}

          <div className="alert-modal-row">
            <label className="modal-label">
              Alert Type
            </label>

            <select
              className="filter-select"
              value={form.alert_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  alert_type:
                    e.target.value,
                })
              }
            >
              <option value="Accident">
                Accident
              </option>

              <option value="Fire">
                Fire
              </option>

              <option value="Road Block">
                Road Block
              </option>

              <option value="Medical Emergency">
                Medical Emergency
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* SEVERITY */}

          <div className="alert-modal-row">
            <label className="modal-label">
              Severity
            </label>

            <select
              className="filter-select"
              value={form.severity}
              onChange={(e) =>
                setForm({
                  ...form,
                  severity:
                    e.target.value,
                })
              }
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

          {/* LOCATION */}

          <div className="alert-modal-row">
            <label className="modal-label">
              Location
            </label>

            <input
              type="text"
              className="filter-select"
              placeholder="Enter location"
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location:
                    e.target.value,
                })
              }
            />
          </div>

          {/* DESCRIPTION */}

          <div className="alert-modal-row">
            <label className="modal-label">
              Description
            </label>

            <textarea
              className="alert-description-input"
              placeholder="Describe the emergency..."
              rows="4"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />
          </div>

          {/* ACTIONS */}

          <div className="alert-modal-actions">

            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              disabled={reporting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-alert btn-alert-resolve"
              disabled={reporting}
            >
              {reporting
                ? "Reporting..."
                : "Report Emergency"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// ALERTS CONTENT
// ============================================================

function AlertsContent({ role }) {
  const isAdmin =
    role === "admin";

  const isOperator =
    role === "operator";

  const isCommuter =
    role === "commuter";

  const visibleCategories =
    isAdmin
      ? ADMIN_CATEGORIES
      : isOperator
      ? OPERATOR_CATEGORIES
      : COMMUTER_CATEGORIES;

  // ============================================================
  // STATE
  // ============================================================

  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedAlert, setSelectedAlert] =
    useState(null);

  const [dismissed, setDismissed] =
    useState([]);

  const [showReportModal, setShowReportModal] =
    useState(false);

  const [reporting, setReporting] =
    useState(false);

  const [reportForm, setReportForm] =
    useState({
      alert_type: "Accident",
      description: "",
      location: "",
      latitude: null,
      longitude: null,
      severity: "High",
    });

  // ============================================================
  // FILTERS
  // ============================================================

  const [filterType, setFilterType] =
    useState("All");

  const [filterRoad, setFilterRoad] =
    useState("All");

  const [filterSev, setFilterSev] =
    useState("All");

  const [filterStat, setFilterStat] =
    useState("All");

  const [pillFilter, setPillFilter] =
    useState("All");

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/alerts/");

      const formattedAlerts =
        response.data.map(
          transformAlert
        );

      setAlerts(
        formattedAlerts
      );
    } catch (err) {
      console.error(
        "Failed to fetch alerts:",
        err
      );

      if (
        err.response?.status === 401
      ) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          "Failed to load alerts."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CREATE ALERT
  // ALL ROLES CAN CREATE
  // ============================================================

  const reportEmergency =
    async (e) => {
      e.preventDefault();

      if (
        !reportForm.description.trim()
      ) {
        alert(
          "Please describe the emergency."
        );
        return;
      }

      if (
        !reportForm.location.trim()
      ) {
        alert(
          "Please enter the location."
        );
        return;
      }

      try {
        setReporting(true);

        const response =
          await api.post(
            "/alerts/",
            {
              alert_type:
                reportForm.alert_type,

              description:
                reportForm.description,

              location:
                reportForm.location,

              latitude:
                reportForm.latitude,

              longitude:
                reportForm.longitude,

              severity:
                reportForm.severity,
            }
          );

        const newAlert =
          transformAlert(
            response.data
          );

        setAlerts((prev) => [
          newAlert,
          ...prev,
        ]);

        setShowReportModal(
          false
        );

        setReportForm({
          alert_type: "Accident",
          description: "",
          location: "",
          latitude: null,
          longitude: null,
          severity: "High",
        });

        alert(
          "Emergency reported successfully."
        );
      } catch (err) {
        console.error(
          "Failed to report emergency:",
          err
        );

        if (
          err.response?.status === 401
        ) {
          alert(
            "Please login again."
          );
        } else {
          alert(
            "Failed to report emergency."
          );
        }
      } finally {
        setReporting(false);
      }
    };

  // ============================================================
  // ACKNOWLEDGE
  // ADMIN + OPERATOR ONLY
  // ============================================================

  const acknowledge =
    async (id) => {
      try {
        await api.patch(
          `/alerts/${id}/acknowledge`
        );

        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id
              ? {
                  ...alert,
                  status:
                    "acknowledged",
                  backendStatus:
                    "Acknowledged",
                }
              : alert
          )
        );
      } catch (err) {
        console.error(
          "Failed to acknowledge alert:",
          err
        );

        if (
          err.response?.status ===
          403
        ) {
          alert(
            "You don't have permission to acknowledge this alert."
          );
        } else {
          alert(
            "Failed to acknowledge alert."
          );
        }
      }
    };

  // ============================================================
  // RESOLVE
  // ADMIN + OPERATOR ONLY
  // ============================================================

  const resolve =
    async (id) => {
      try {
        await api.patch(
          `/alerts/${id}/resolve`
        );

        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id
              ? {
                  ...alert,
                  status:
                    "resolved",
                  backendStatus:
                    "Resolved",
                }
              : alert
          )
        );
      } catch (err) {
        console.error(
          "Failed to resolve alert:",
          err
        );

        if (
          err.response?.status ===
          403
        ) {
          alert(
            "You don't have permission to resolve this alert."
          );
        } else {
          alert(
            "Failed to resolve alert."
          );
        }
      }
    };

  // ============================================================
  // DISMISS
  // COMMUTER UI ONLY
  // ============================================================

  const dismiss = (id) => {
    setDismissed((prev) => [
      ...prev,
      id,
    ]);
  };

  // ============================================================
  // ROLE FILTER
  // ============================================================

  const roleFiltered =
    alerts.filter(
      (a) =>
        visibleCategories.includes(
          a.category
        ) &&
        !dismissed.includes(
          a.id
        )
    );

  // ============================================================
  // FILTERS
  // ============================================================

  const displayed =
    roleFiltered.filter((a) => {

      if (isCommuter) {
        if (
          pillFilter !== "All" &&
          a.severity !==
            pillFilter.toLowerCase()
        ) {
          return false;
        }
      } else {
        if (
          filterType !== "All" &&
          a.type !== filterType
        ) {
          return false;
        }

        if (
          filterRoad !== "All" &&
          a.road !== filterRoad
        ) {
          return false;
        }

        if (
          filterSev !== "All" &&
          a.severity !== filterSev
        ) {
          return false;
        }

        if (
          filterStat !== "All" &&
          a.status !== filterStat
        ) {
          return false;
        }
      }

      return true;
    });

  // ============================================================
  // COUNTERS
  // ============================================================

  const critical =
    roleFiltered.filter(
      (a) =>
        a.severity === "high" &&
        a.status !== "resolved"
    ).length;

  const warnings =
    roleFiltered.filter(
      (a) =>
        a.severity === "medium" &&
        a.status !== "resolved"
    ).length;

  const active =
    roleFiltered.filter(
      (a) =>
        a.status !== "resolved"
    ).length;

  const resolved =
    roleFiltered.filter(
      (a) =>
        a.status === "resolved"
    ).length;

  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  const allTypes = [
    ...new Set(
      roleFiltered.map(
        (a) => a.type
      )
    ),
  ];

  const allRoads = [
    ...new Set(
      roleFiltered.map(
        (a) => a.road
      )
    ),
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="alerts-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="alerts-page-header">

        <div>
          <h1>
            TRAFFIC ALERTS
          </h1>

          <p>
            {isCommuter
              ? "Important traffic conditions that may affect your journey."
              : "Real-time traffic incidents and system alerts."}
          </p>
        </div>

        {/* ====================================================
            ALL ROLES CAN REPORT
            ==================================================== */}

        <button
          className="btn-report-emergency"
          onClick={() =>
            setShowReportModal(
              true
            )
          }
        >
          <AlertTriangle
            size={16}
          />

          Report Emergency
        </button>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="alerts-summary-row">

        <div className="alert-summary-card">

          <div className="alert-summary-icon critical">
            <AlertCircle
              size={20}
              color="#f87171"
            />
          </div>

          <div className="alert-summary-info">
            <div className="count">
              {critical}
            </div>

            <div className="label">
              Critical
            </div>
          </div>

        </div>

        <div className="alert-summary-card">

          <div className="alert-summary-icon warning">
            <AlertTriangle
              size={20}
              color="#fbbf24"
            />
          </div>

          <div className="alert-summary-info">
            <div className="count">
              {warnings}
            </div>

            <div className="label">
              Warnings
            </div>
          </div>

        </div>

        <div className="alert-summary-card">

          <div className="alert-summary-icon active">
            <Activity
              size={20}
              color="#00d4ff"
            />
          </div>

          <div className="alert-summary-info">
            <div className="count">
              {active}
            </div>

            <div className="label">
              Active
            </div>
          </div>

        </div>

        <div className="alert-summary-card">

          <div className="alert-summary-icon resolved">
            <CheckCircle
              size={20}
              color="#4ade80"
            />
          </div>

          <div className="alert-summary-info">
            <div className="count">
              {resolved}
            </div>

            <div className="label">
              Resolved
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="alerts-filter-bar">

        {isCommuter ? (
          <div className="alerts-pill-tabs">

            {[
              "All",
              "High",
              "Medium",
              "Low",
            ].map((p) => (
              <button
                key={p}
                className={`pill-tab ${
                  pillFilter === p
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPillFilter(
                    p
                  )
                }
              >
                {p}
              </button>
            ))}

          </div>
        ) : (
          <>
            <Filter
              size={16}
              color="#8da2c5"
            />

            <select
              className="filter-select"
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Types
              </option>

              {allTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>

            <select
              className="filter-select"
              value={filterRoad}
              onChange={(e) =>
                setFilterRoad(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Roads
              </option>

              {allRoads.map(
                (road) => (
                  <option
                    key={road}
                    value={road}
                  >
                    {road}
                  </option>
                )
              )}
            </select>

            <select
              className="filter-select"
              value={filterSev}
              onChange={(e) =>
                setFilterSev(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Severity
              </option>

              <option value="high">
                High / Critical
              </option>

              <option value="medium">
                Medium / Warning
              </option>

              <option value="low">
                Low / Info
              </option>
            </select>

            <select
              className="filter-select"
              value={filterStat}
              onChange={(e) =>
                setFilterStat(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="acknowledged">
                Acknowledged
              </option>

              <option value="resolved">
                Resolved
              </option>
            </select>
          </>
        )}

      </div>

      {/* ======================================================
          ALERT LIST
      ====================================================== */}

      <div>

        <div className="alerts-section-title">
          {filterStat === "resolved"
            ? "Resolved Alerts"
            : "Alerts"}{" "}
          — {displayed.length}{" "}
          showing
        </div>

        {loading && (
          <div className="no-alerts-msg">
            Loading alerts...
          </div>
        )}

        {error && (
          <div className="no-alerts-msg">
            {error}
          </div>
        )}

        {!loading &&
          !error && (
            <div className="alerts-list">

              {displayed.length ===
                0 && (
                <div className="no-alerts-msg">
                  No alerts match the
                  selected filters.
                </div>
              )}

              {displayed.map(
                (alert) => {

                  const cardSev =
                    alert.status ===
                    "resolved"
                      ? "sev-resolved"
                      : sevClass(
                          alert.severity
                        );

                  return (
                    <div
                      key={alert.id}
                      className={`alert-card ${cardSev} ${
                        alert.status ===
                        "resolved"
                          ? "resolved"
                          : ""
                      }`}
                    >

                      {/* TOP */}

                      <div className="alert-card-top">

                        <span
                          className={`alert-type-badge ${badgeClass(
                            alert.status ===
                              "resolved"
                              ? "resolved"
                              : alert.severity
                          )}`}
                        >
                          <SeverityIcon
                            sev={
                              alert.status ===
                              "resolved"
                                ? "low"
                                : alert.severity
                            }
                            size={12}
                          />

                          {alert.type}
                        </span>

                        <StatusPill
                          status={
                            alert.status
                          }
                        />

                      </div>

                      {/* BODY */}

                      <div className="alert-card-body">

                        <div className="alert-road">
                          {alert.road}
                        </div>

                        <div className="alert-meta">

                          {alert.speed !=
                            null && (
                            <span>
                              <Navigation
                                size={
                                  12
                                }
                              />{" "}
                              {
                                alert.speed
                              }{" "}
                              km/h
                            </span>
                          )}

                          {alert.volume !=
                            null && (
                            <span>
                              <Zap
                                size={
                                  12
                                }
                              />{" "}
                              {
                                alert.volume
                              }{" "}
                              vehicles
                            </span>
                          )}

                          {alert.camera && (
                            <span>
                              <Camera
                                size={
                                  12
                                }
                              />{" "}
                              {
                                alert.camera
                              }
                            </span>
                          )}

                        </div>

                        <div className="alert-message">
                          {
                            alert.message
                          }
                        </div>

                      </div>

                      {/* FOOTER */}

                      <div className="alert-card-footer">

                        <span className="alert-time">
                          <Clock
                            size={
                              12
                            }
                            style={{
                              marginRight: 4,
                            }}
                          />

                          {
                            alert.time
                          }
                        </span>

                        <div className="alert-actions">

                          {/* VIEW */}

                          <button
                            className="btn-alert btn-alert-view"
                            onClick={() =>
                              setSelectedAlert(
                                alert
                              )
                            }
                          >
                            <Eye
                              size={
                                13
                              }
                            />

                            View
                          </button>

                          {/* ACKNOWLEDGE */}

                          {(isAdmin ||
                            isOperator) &&
                            alert.status ===
                              "active" && (
                              <button
                                className="btn-alert btn-alert-ack"
                                onClick={() =>
                                  acknowledge(
                                    alert.id
                                  )
                                }
                              >
                                <UserCheck
                                  size={
                                    13
                                  }
                                />

                                Acknowledge
                              </button>
                            )}

                          {/* RESOLVE */}

                          {(isAdmin ||
                            isOperator) &&
                            alert.status !==
                              "resolved" && (
                              <button
                                className="btn-alert btn-alert-resolve"
                                onClick={() =>
                                  resolve(
                                    alert.id
                                  )
                                }
                              >
                                <CheckCheck
                                  size={
                                    13
                                  }
                                />

                                Resolve
                              </button>
                            )}

                          {/* ADMIN ASSIGN */}

                          {isAdmin &&
                            alert.status ===
                              "active" && (
                              <button className="btn-alert btn-alert-assign">
                                Assign
                              </button>
                            )}

                          {/* COMMUTER DISMISS */}

                          {isCommuter && (
                            <button
                              className="btn-alert btn-alert-dismiss"
                              onClick={() =>
                                dismiss(
                                  alert.id
                                )
                              }
                            >
                              <BellOff
                                size={
                                  13
                                }
                              />

                              Dismiss
                            </button>
                          )}

                        </div>
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </div>

      {/* ======================================================
          DETAIL MODAL
      ====================================================== */}

      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          role={role}
          onClose={() =>
            setSelectedAlert(
              null
            )
          }
          onAck={acknowledge}
          onResolve={resolve}
          onDismiss={dismiss}
        />
      )}

      {/* ======================================================
          CREATE ALERT MODAL
      ====================================================== */}

      {showReportModal && (
        <ReportEmergencyModal
          form={reportForm}
          setForm={setReportForm}
          onSubmit={reportEmergency}
          onClose={() =>
            setShowReportModal(
              false
            )
          }
          reporting={reporting}
        />
      )}

    </div>
  );
}

// ============================================================
// ROLE-AWARE WRAPPER
// ============================================================

export default function Alerts() {
  const userRole =
    localStorage.getItem(
      "role"
    ) || "commuter";

  if (userRole === "admin") {
    return (
      <Layout>
        <AlertsContent role="admin" />
      </Layout>
    );
  }

  if (userRole === "operator") {
    return (
      <div className="operator-layout">

        <OperatorSidebar />

        <div
          className="operator-dashboard operator-page-content animate-fade-in"
          style={{
            width: "100%",
            minHeight: "100vh",
          }}
        >
          <AlertsContent
            role="operator"
          />
        </div>

      </div>
    );
  }

  return (
    <CommuterAlertsWrapper />
  );
}

// ============================================================
// COMMUTER WRAPPER
// ============================================================

function CommuterAlertsWrapper() {
  const username =
    localStorage.getItem(
      "username"
    ) || "User";

  const [timeStr, setTimeStr] =
    useState(
      () =>
        new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        )
    );

  useEffect(() => {
    const timer =
      setInterval(() => {
        setTimeStr(
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          )
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  return (
    <div className="commuter-dashboard">

      <motion.header
        className="commuter-topbar"
        initial={{
          opacity: 0,
          y: -30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <div className="top-left">

          <div>
            <h1>
              AI Traffic Assistant
            </h1>

            <span>
              Welcome back,{" "}
              {username}
            </span>
          </div>

        </div>

        <div className="top-right">
          <UserMenu />
        </div>

      </motion.header>

      <nav
        className="commuter-nav"
        aria-label="Commuter navigation"
      >
        <NavLink
          to="/commuter"
          end
        >
          Home
        </NavLink>

        <NavLink to="/live-map">
          Live Traffic
        </NavLink>

        <NavLink to="/prediction">
          Prediction
        </NavLink>

        <NavLink to="/alerts">
          Alerts
        </NavLink>
      </nav>

      <div
        className="dashboard-container"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <AlertsContent
          role="commuter"
        />
      </div>

    </div>
  );
}
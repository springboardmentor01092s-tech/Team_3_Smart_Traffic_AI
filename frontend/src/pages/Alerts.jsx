import { useState } from "react";
import {
  AlertTriangle, AlertCircle, Info, CheckCircle,
  Zap, Camera, Navigation, Activity, Clock,
  X, Eye, BellOff, UserCheck, CheckCheck, Filter
} from "lucide-react";
import Layout from "../components/admin/Layout";
import OperatorSidebar from "../components/OperatorSidebar";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import UserMenu from "../components/UserMenu";
import "../styles/alerts.css";

// ============================================================
// DEMO ALERT DATA — replace with API call later
// ============================================================
const DEMO_ALERTS = [
  {
    id: 1,
    type: "High Congestion",
    severity: "high",
    road: "NH-24",
    camera: null,
    speed: 18,
    volume: 820,
    message: "Severe congestion detected on NH-24. Traffic movement is heavily restricted.",
    status: "active",
    time: "2:35 PM",
    category: "traffic",        // traffic | operational | system
  },
  {
    id: 2,
    type: "Accident Detected",
    severity: "high",
    road: "Ring Road",
    camera: null,
    speed: null,
    volume: null,
    message: "Possible accident reported on Ring Road. Traffic movement is significantly reduced.",
    status: "active",
    time: "2:28 PM",
    category: "traffic",
  },
  {
    id: 3,
    type: "Traffic Buildup",
    severity: "medium",
    road: "MG Road",
    camera: null,
    speed: 31,
    volume: null,
    message: "Traffic volume is increasing and moderate congestion is developing on MG Road.",
    status: "active",
    time: "2:22 PM",
    category: "traffic",
  },
  {
    id: 4,
    type: "Predicted Congestion",
    severity: "medium",
    road: "Outer Ring Road",
    camera: null,
    speed: null,
    volume: null,
    message: "AI model predicts traffic congestion will increase on Outer Ring Road during the next period.",
    status: "active",
    time: "2:15 PM",
    category: "traffic",
  },
  {
    id: 5,
    type: "Camera Offline",
    severity: "medium",
    road: "Outer Ring Road",
    camera: "Camera 03",
    speed: null,
    volume: null,
    message: "Traffic monitoring camera (Camera 03) on Outer Ring Road is currently unavailable.",
    status: "active",
    time: "2:05 PM",
    category: "system",         // system / operational — hidden from commuter
  },
  {
    id: 6,
    type: "Traffic Normalized",
    severity: "low",
    road: "MG Road",
    camera: null,
    speed: null,
    volume: null,
    message: "Traffic conditions have returned to normal on MG Road.",
    status: "resolved",
    time: "1:45 PM",
    category: "traffic",
  },
];

// Categories visible to each role
const ADMIN_CATEGORIES    = ["traffic", "system", "operational"];
const OPERATOR_CATEGORIES = ["traffic", "operational", "system"]; // same as admin but no assign
const COMMUTER_CATEGORIES = ["traffic"]; // no system/operational

// ============================================================
// Helpers
// ============================================================
function sevClass(sev)  { return `sev-${sev}`; }
function badgeClass(sev){ return `badge-${sev}`; }

function SeverityIcon({ sev, size = 16 }) {
  if (sev === "high")   return <AlertCircle  size={size} color="#f87171" />;
  if (sev === "medium") return <AlertTriangle size={size} color="#fbbf24" />;
  if (sev === "low")    return <CheckCircle   size={size} color="#4ade80" />;
  return <Info size={size} color="#95a9c8" />;
}

function StatusPill({ status }) {
  const map = {
    active:       { cls: "status-active",       label: "Active" },
    acknowledged: { cls: "status-acknowledged", label: "Acknowledged" },
    resolved:     { cls: "status-resolved",     label: "Resolved" },
  };
  const s = map[status] || map.active;
  return <span className={`alert-status-pill ${s.cls}`}>{s.label}</span>;
}

// ============================================================
// Detail Modal
// ============================================================
function AlertModal({ alert, role, onClose, onAck, onResolve, onDismiss }) {
  if (!alert) return null;
  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={e => e.stopPropagation()}>
        <h2>Alert Details</h2>

        <div className="alert-modal-row">
          <span className="modal-label">Type</span>
          <span className="modal-value">{alert.type}</span>
        </div>
        <div className="alert-modal-row">
          <span className="modal-label">Severity</span>
          <span className="modal-value" style={{ textTransform: "capitalize" }}>{alert.severity}</span>
        </div>
        <div className="alert-modal-row">
          <span className="modal-label">Road</span>
          <span className="modal-value">{alert.road}</span>
        </div>
        {alert.camera && (
          <div className="alert-modal-row">
            <span className="modal-label">Camera</span>
            <span className="modal-value">{alert.camera}</span>
          </div>
        )}
        {alert.speed != null && (
          <div className="alert-modal-row">
            <span className="modal-label">Speed</span>
            <span className="modal-value">{alert.speed} km/h</span>
          </div>
        )}
        {alert.volume != null && (
          <div className="alert-modal-row">
            <span className="modal-label">Traffic Volume</span>
            <span className="modal-value">{alert.volume} vehicles</span>
          </div>
        )}
        <div className="alert-modal-row">
          <span className="modal-label">Status</span>
          <span className="modal-value" style={{ textTransform: "capitalize" }}>{alert.status}</span>
        </div>
        <div className="alert-modal-row">
          <span className="modal-label">Detected</span>
          <span className="modal-value">{alert.time}</span>
        </div>

        <div className="alert-modal-desc">{alert.message}</div>

        <div className="alert-modal-actions">
          {(role === "admin" || role === "operator") && alert.status === "active" && (
            <button className="btn-alert btn-alert-ack" onClick={() => { onAck(alert.id); onClose(); }}>
              Acknowledge
            </button>
          )}
          {(role === "admin" || role === "operator") && alert.status !== "resolved" && (
            <button className="btn-alert btn-alert-resolve" onClick={() => { onResolve(alert.id); onClose(); }}>
              Resolve
            </button>
          )}
          {role === "commuter" && (
            <button className="btn-alert btn-alert-dismiss" onClick={() => { onDismiss(alert.id); onClose(); }}>
              Dismiss
            </button>
          )}
          <button className="btn-modal-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared Alerts Content
// ============================================================
function AlertsContent({ role }) {
  const isAdmin    = role === "admin";
  const isOperator = role === "operator";
  const isCommuter = role === "commuter";

  // Determine visible categories for this role
  const visibleCategories =
    isAdmin    ? ADMIN_CATEGORIES :
    isOperator ? OPERATOR_CATEGORIES :
                 COMMUTER_CATEGORIES;

  // Local state: alerts (with mutable status & dismissed ids)
  const [alerts, setAlerts]           = useState(DEMO_ALERTS);
  const [dismissed, setDismissed]     = useState([]);  // commuter-dismissed ids
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Filters
  const [filterType, setFilterType]   = useState("All");
  const [filterRoad, setFilterRoad]   = useState("All");
  const [filterSev,  setFilterSev]    = useState("All");
  const [filterStat, setFilterStat]   = useState("All");
  const [pillFilter, setPillFilter]   = useState("All"); // commuter only

  // Actions
  const acknowledge = (id) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "acknowledged" } : a));

  const resolve = (id) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));

  const dismiss = (id) =>
    setDismissed(prev => [...prev, id]);

  // Visible alerts for this role
  const roleFiltered = alerts.filter(a =>
    visibleCategories.includes(a.category) &&
    !dismissed.includes(a.id)
  );

  // Apply filters
  const displayed = roleFiltered.filter(a => {
    if (isCommuter) {
      if (pillFilter !== "All" && a.severity !== pillFilter.toLowerCase()) return false;
    } else {
      if (filterType !== "All" && a.type !== filterType) return false;
      if (filterRoad !== "All" && a.road !== filterRoad) return false;
      if (filterSev  !== "All" && a.severity !== filterSev) return false;
      if (filterStat !== "All" && a.status !== filterStat) return false;
    }
    return true;
  });

  // Summary counts
  const critical = roleFiltered.filter(a => a.severity === "high"   && a.status !== "resolved").length;
  const warnings = roleFiltered.filter(a => a.severity === "medium" && a.status !== "resolved").length;
  const active   = roleFiltered.filter(a => a.status !== "resolved").length;
  const resolved = roleFiltered.filter(a => a.status === "resolved").length;

  // Unique values for filters
  const allTypes = [...new Set(roleFiltered.map(a => a.type))];
  const allRoads = [...new Set(roleFiltered.map(a => a.road))];

  return (
    <div className="alerts-page">
      {/* HEADER */}
      <div className="alerts-page-header">
        <h1>TRAFFIC ALERTS</h1>
        <p>
          {isCommuter
            ? "Important traffic conditions that may affect your journey."
            : "Real-time traffic incidents and system alerts."}
        </p>
      </div>

      {/* SUMMARY COUNTERS */}
      <div className="alerts-summary-row">
        <div className="alert-summary-card">
          <div className="alert-summary-icon critical">
            <AlertCircle size={20} color="#f87171" />
          </div>
          <div className="alert-summary-info">
            <div className="count">{critical}</div>
            <div className="label">Critical</div>
          </div>
        </div>
        <div className="alert-summary-card">
          <div className="alert-summary-icon warning">
            <AlertTriangle size={20} color="#fbbf24" />
          </div>
          <div className="alert-summary-info">
            <div className="count">{warnings}</div>
            <div className="label">Warnings</div>
          </div>
        </div>
        <div className="alert-summary-card">
          <div className="alert-summary-icon active">
            <Activity size={20} color="#00d4ff" />
          </div>
          <div className="alert-summary-info">
            <div className="count">{active}</div>
            <div className="label">Active</div>
          </div>
        </div>
        <div className="alert-summary-card">
          <div className="alert-summary-icon resolved">
            <CheckCircle size={20} color="#4ade80" />
          </div>
          <div className="alert-summary-info">
            <div className="count">{resolved}</div>
            <div className="label">Resolved</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="alerts-filter-bar">
        {isCommuter ? (
          <div className="alerts-pill-tabs">
            {["All", "High", "Medium", "Low"].map(p => (
              <button
                key={p}
                className={`pill-tab ${pillFilter === p ? "active" : ""}`}
                onClick={() => setPillFilter(p)}
              >
                {p}
              </button>
            ))}
          </div>
        ) : (
          <>
            <Filter size={16} color="#8da2c5" />
            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="filter-select" value={filterRoad} onChange={e => setFilterRoad(e.target.value)}>
              <option value="All">All Roads</option>
              {allRoads.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="filter-select" value={filterSev} onChange={e => setFilterSev(e.target.value)}>
              <option value="All">All Severity</option>
              <option value="high">High / Critical</option>
              <option value="medium">Medium / Warning</option>
              <option value="low">Low / Info</option>
            </select>
            <select className="filter-select" value={filterStat} onChange={e => setFilterStat(e.target.value)}>
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </>
        )}
      </div>

      {/* ALERT LIST */}
      <div>
        <div className="alerts-section-title">
          {filterStat === "resolved" ? "Resolved Alerts" : "Active Alerts"} — {displayed.length} showing
        </div>
        <div className="alerts-list">
          {displayed.length === 0 && (
            <div className="no-alerts-msg">No alerts match the selected filters.</div>
          )}
          {displayed.map(alert => {
            const cardSev = alert.status === "resolved" ? "sev-resolved" : sevClass(alert.severity);
            return (
              <div key={alert.id} className={`alert-card ${cardSev} ${alert.status === "resolved" ? "resolved" : ""}`}>
                {/* TOP ROW */}
                <div className="alert-card-top">
                  <span className={`alert-type-badge ${badgeClass(alert.status === "resolved" ? "resolved" : alert.severity)}`}>
                    <SeverityIcon sev={alert.status === "resolved" ? "low" : alert.severity} size={12} />
                    {alert.type}
                  </span>
                  <StatusPill status={alert.status} />
                </div>

                {/* BODY */}
                <div className="alert-card-body">
                  <div className="alert-road">
                    {alert.camera ? `${alert.camera} — ${alert.road}` : alert.road}
                  </div>
                  <div className="alert-meta">
                    {alert.speed  != null && <span><Navigation size={12} /> {alert.speed} km/h</span>}
                    {alert.volume != null && <span><Zap size={12} /> {alert.volume} vehicles</span>}
                    {alert.camera && <span><Camera size={12} /> {alert.camera}</span>}
                  </div>
                  <div className="alert-message">{alert.message}</div>
                </div>

                {/* FOOTER */}
                <div className="alert-card-footer">
                  <span className="alert-time"><Clock size={12} style={{ marginRight: 4 }} />{alert.time}</span>
                  <div className="alert-actions">
                    {/* View — all roles */}
                    <button
                      className="btn-alert btn-alert-view"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye size={13} /> View
                    </button>

                    {/* Admin / Operator actions */}
                    {(isAdmin || isOperator) && alert.status === "active" && (
                      <button
                        className="btn-alert btn-alert-ack"
                        onClick={() => acknowledge(alert.id)}
                      >
                        <UserCheck size={13} /> Acknowledge
                      </button>
                    )}
                    {(isAdmin || isOperator) && alert.status !== "resolved" && (
                      <button
                        className="btn-alert btn-alert-resolve"
                        onClick={() => resolve(alert.id)}
                      >
                        <CheckCheck size={13} /> Resolve
                      </button>
                    )}
                    {isAdmin && alert.status === "active" && (
                      <button className="btn-alert btn-alert-assign">
                        Assign
                      </button>
                    )}

                    {/* Commuter dismiss */}
                    {isCommuter && (
                      <button
                        className="btn-alert btn-alert-dismiss"
                        onClick={() => dismiss(alert.id)}
                      >
                        <BellOff size={13} /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          role={role}
          onClose={() => setSelectedAlert(null)}
          onAck={acknowledge}
          onResolve={resolve}
          onDismiss={dismiss}
        />
      )}
    </div>
  );
}

// ============================================================
// Role-aware wrapper — same pattern as LiveMap.jsx / Prediction.jsx
// ============================================================
export default function Alerts() {
  const userRole = localStorage.getItem("role") || "commuter";

  if (userRole === "admin") {
    return <Layout><AlertsContent role="admin" /></Layout>;
  }

  if (userRole === "operator") {
    return (
      <div className="operator-layout">
        <OperatorSidebar />
        <div
          className="operator-dashboard operator-page-content animate-fade-in"
          style={{ width: "100%", minHeight: "100vh" }}
        >
          <AlertsContent role="operator" />
        </div>
      </div>
    );
  }

  // Commuter — wrap with the same header/nav as LiveMap.jsx commuter block
  return <CommuterAlertsWrapper />;
}

// ============================================================
// Commuter wrapper (reuses same nav as LiveMap commuter block)
// ============================================================
function CommuterAlertsWrapper() {
  const username = localStorage.getItem("username") || "User";
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  // Update clock
  useState(() => {
    const t = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  });

  return (
    <div className="commuter-dashboard">
      <motion.header
        className="commuter-topbar"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="top-left">
          <div>
            <h1>AI Traffic Assistant</h1>
            <span>Welcome back, {username}</span>
          </div>
        </div>
        <div className="top-right">
          <UserMenu />
        </div>
      </motion.header>

      <nav className="commuter-nav" aria-label="Commuter navigation">
        <NavLink to="/commuter" end>Home</NavLink>
        <NavLink to="/live-map">Live Traffic</NavLink>
        <NavLink to="/prediction">Prediction</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
      </nav>

      <div className="dashboard-container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <AlertsContent role="commuter" />
      </div>
    </div>
  );
}

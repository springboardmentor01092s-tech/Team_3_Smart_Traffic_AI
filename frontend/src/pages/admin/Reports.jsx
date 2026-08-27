import { useEffect, useState } from "react";
import {
  Download,
  RefreshCw,
  FileText,
  Activity,
  AlertTriangle,
  MapPin,
  Gauge,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Layout from "../../components/admin/Layout";
import api from "../../services/api";
import "./reports.css";

const RANGE_OPTIONS = [
  { label: "24 Hours", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
];

export default function Reports() {
  const [days, setDays] = useState(7);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/reports/traffic-summary?days=${days}`);

      setReportData(response.data);
    } catch (err) {
      console.error("Reports fetch failed:", err);
      setError("Unable to load traffic reports.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [days]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/reports/export-csv?days=${days}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = "traffic_report.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report export failed:", err);
      alert("Unable to download the traffic report.");
    }
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("TRAFFICVISION AI", 14, 20);

      doc.setFontSize(14);
      doc.text("Traffic Summary Report", 14, 30);

      doc.setFontSize(10);

      doc.text(
        `Report Period: Last ${days} ${days === 1 ? "Day" : "Days"}`,
        14,
        40,
      );

      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 47);

      doc.text(
        `Total Readings: ${reportData.statistics.total_readings}`,
        14,
        57,
      );

      doc.text(`Accidents: ${reportData.statistics.accidents}`, 14, 64);

      doc.text(`Roads Covered: ${reportData.statistics.roads_covered}`, 14, 71);

      doc.text(
        `Average Speed: ${reportData.statistics.average_speed} km/h`,
        14,
        78,
      );

      const tableData = reportData.roads.map((road) => [
        road.road_name,
        road.readings,
        `${road.avg_speed} km/h`,
        road.high_congestion_count,
        road.status,
      ]);

      autoTable(doc, {
        startY: 88,
        head: [
          ["Road", "Readings", "Average Speed", "High Congestion", "Status"],
        ],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fontStyle: "bold",
        },
      });

      doc.save("TrafficVision_Traffic_Report.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Unable to generate PDF report.");
    }
  };

  const statistics = reportData?.statistics;
  const congestion = reportData?.congestion;

  return (
    <Layout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1>TRAFFIC REPORTS</h1>
            <p>
              Historical traffic summary, road performance and congestion
              analysis.
            </p>
          </div>

          <div className="reports-controls">
            <div className="range-toggle">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={days === option.value ? "active" : ""}
                  onClick={() => setDays(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              className="report-icon-btn"
              onClick={fetchReports}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>

            <button className="report-export-btn" onClick={handleExport}>
              <Download size={16} />
              Export CSV
            </button>

            <button className="report-export-btn" onClick={handleExportPDF}>
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="reports-panel">
            <div className="reports-message">Loading traffic reports...</div>
          </div>
        ) : error ? (
          <div className="reports-panel">
            <div className="reports-error">{error}</div>
          </div>
        ) : reportData ? (
          <>
            <div className="reports-summary-grid">
              <div className="report-stat-card">
                <div className="report-stat-icon">
                  <Activity size={22} />
                </div>

                <div>
                  <span>Total Readings</span>
                  <strong>{statistics.total_readings}</strong>
                </div>
              </div>

              <div className="report-stat-card">
                <div className="report-stat-icon">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <span>Accidents</span>
                  <strong>{statistics.accidents}</strong>
                </div>
              </div>

              <div className="report-stat-card">
                <div className="report-stat-icon">
                  <MapPin size={22} />
                </div>

                <div>
                  <span>Roads Covered</span>
                  <strong>{statistics.roads_covered}</strong>
                </div>
              </div>

              <div className="report-stat-card">
                <div className="report-stat-icon">
                  <Gauge size={22} />
                </div>

                <div>
                  <span>Average Speed</span>
                  <strong>{statistics.average_speed} km/h</strong>
                </div>
              </div>
            </div>

            <div className="reports-overview">
              <div className="reports-congestion-card">
                <div className="reports-section-heading">
                  <div>
                    <h2>Congestion Overview</h2>
                    <p>Traffic condition distribution</p>
                  </div>
                </div>

                <div className="congestion-stats">
                  <div className="congestion-item low">
                    <span>Low</span>
                    <strong>{congestion.Low || 0}</strong>
                  </div>

                  <div className="congestion-item medium">
                    <span>Medium</span>
                    <strong>{congestion.Medium || 0}</strong>
                  </div>

                  <div className="congestion-item high">
                    <span>High</span>
                    <strong>{congestion.High || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="reports-period-card">
                <FileText size={24} />

                <div>
                  <span>Report Period</span>

                  <strong>
                    Last {days} {days === 1 ? "Day" : "Days"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="reports-panel">
              <div className="reports-section-heading">
                <div>
                  <h2>Road Performance</h2>
                  <p>Road-wise traffic readings and congestion status.</p>
                </div>
              </div>

              {reportData.roads.length === 0 ? (
                <div className="reports-message">
                  No traffic data available for this period.
                </div>
              ) : (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Road</th>
                        <th>Readings</th>
                        <th>Average Speed</th>
                        <th>High Congestion</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportData.roads.map((road) => (
                        <tr key={road.road_name}>
                          <td>
                            <strong>{road.road_name}</strong>
                          </td>

                          <td>{road.readings}</td>

                          <td>{road.avg_speed} km/h</td>

                          <td>
                            <span
                              className={
                                road.high_congestion_count > 0
                                  ? "high-congestion"
                                  : "normal-congestion"
                              }
                            >
                              {road.high_congestion_count}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`road-status ${road.status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {road.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="reports-panel">
            <div className="reports-message">
              No traffic data available for this period.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { Download, RefreshCw, FileText } from "lucide-react";
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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/reports/traffic-summary?days=${days}`);

      setReports(response.data || []);
    } catch (err) {
      console.error("Reports fetch failed:", err);
      setError("Unable to load traffic reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [days]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(`/reports/export-csv?days=${days}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      const tableData = reports.map((report) => [
        report.road_name,
        report.readings,
        `${report.avg_speed} km/h`,
        report.high_congestion_count,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [["Road", "Readings", "Average Speed", "High Congestion"]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 10,
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

  return (
    <Layout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1>TRAFFIC REPORTS</h1>
            <p>Historical traffic summary and congestion reports.</p>
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

        <div className="reports-summary-card">
          <FileText size={28} />

          <div>
            <span>Report Period</span>
            <strong>
              Last {days} {days === 1 ? "Day" : "Days"}
            </strong>
          </div>
        </div>

        <div className="reports-panel">
          <div className="reports-panel-title">Traffic Summary</div>

          {loading ? (
            <div className="reports-message">Loading traffic reports...</div>
          ) : error ? (
            <div className="reports-error">{error}</div>
          ) : reports.length === 0 ? (
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
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => (
                    <tr key={report.road_name}>
                      <td>
                        <strong>{report.road_name}</strong>
                      </td>

                      <td>{report.readings}</td>

                      <td>{report.avg_speed} km/h</td>

                      <td>
                        <span
                          className={
                            report.high_congestion_count > 0
                              ? "high-congestion"
                              : "normal-congestion"
                          }
                        >
                          {report.high_congestion_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

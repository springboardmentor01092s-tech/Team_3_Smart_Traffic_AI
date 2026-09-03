import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function useLiveTrafficReport() {
  const [liveData, setLiveData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch both live traffic telemetry and real incident alerts
      const [trafficRes, alertsRes] = await Promise.allSettled([
        api.get("/traffic/live"),
        api.get("/alerts/"),
      ]);

      const traffic = trafficRes.status === "fulfilled" ? trafficRes.value.data || [] : [];
      const alerts = alertsRes.status === "fulfilled" ? alertsRes.value.data || [] : [];

      setLiveData(Array.isArray(traffic) ? traffic : []);
      setAlertsData(Array.isArray(alerts) ? alerts : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Live traffic & alerts report fetch failed:", err);
      setError("Unable to connect to live traffic system.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Integrated Incidents List combining /alerts/ and /traffic/live incidents
  const incidentsList = useMemo(() => {
    const list = [];

    // 1. Add real backend Alerts
    alertsData.forEach((a) => {
      // Find matching traffic data for related telemetry
      const matchedTraffic = liveData.find(
        (t) =>
          a.location &&
          (a.location.toLowerCase().includes(t.road_name.toLowerCase()) ||
            t.road_name.toLowerCase().includes(a.location.toLowerCase()))
      );

      list.push({
        id: `ALT-${a.id}`,
        rawId: a.id,
        source: "alert",
        alert_type: a.alert_type || "Incident Alert",
        location: a.location || "City Corridor",
        severity: a.severity || "Medium",
        status: a.status || "Active",
        description: a.description || "Traffic incident reported on location.",
        created_at: a.created_at || new Date().toISOString(),
        vehicle_count: matchedTraffic ? matchedTraffic.vehicle_count : "N/A",
        average_speed: matchedTraffic ? matchedTraffic.average_speed : "N/A",
        congestion_level: matchedTraffic ? matchedTraffic.congestion_level : "Medium",
        weather: matchedTraffic ? matchedTraffic.weather : "Clear",
      });
    });

    // 2. Add accidents/high congestion from live traffic if not already present
    liveData.forEach((t) => {
      if (t.accident || t.congestion_level === "High") {
        const exists = list.some(
          (item) => item.location.toLowerCase() === t.road_name.toLowerCase()
        );
        if (!exists) {
          list.push({
            id: `TRF-${t.id || t.road_name}`,
            rawId: t.id,
            source: "traffic",
            alert_type: t.accident ? "Vehicle Accident" : "Severe Congestion",
            location: t.road_name,
            severity: t.accident ? "High" : "Medium",
            status: "Active",
            description: t.accident
              ? `Accident detected on ${t.road_name}. Slow traffic expected.`
              : `High vehicle volume (${t.vehicle_count} vehicles) on ${t.road_name}.`,
            created_at: t.recorded_at || new Date().toISOString(),
            vehicle_count: t.vehicle_count,
            average_speed: t.average_speed,
            congestion_level: t.congestion_level,
            weather: t.weather,
          });
        }
      }
    });

    return list;
  }, [alertsData, liveData]);

  // Derived Report Statistics
  const stats = useMemo(() => {
    if (!liveData || liveData.length === 0) {
      return {
        totalReadings: 0,
        totalVehicles: 0,
        averageSpeed: 0,
        roadsCovered: 0,
        accidents: incidentsList.length,
        congestion: { Low: 0, Medium: 0, High: 0 },
        weatherCounts: {},
        mostCongestedRoad: "N/A",
      };
    }

    const totalReadings = liveData.length;
    const totalVehicles = liveData.reduce((sum, item) => sum + (item.vehicle_count || 0), 0);
    const totalSpeed = liveData.reduce((sum, item) => sum + (item.average_speed || 0), 0);
    const averageSpeed = Math.round((totalSpeed / totalReadings) * 10) / 10;
    const accidentsCount = incidentsList.length;

    const roads = new Set(liveData.map((item) => item.road_name));
    const roadsCovered = roads.size;

    const congestion = { Low: 0, Medium: 0, High: 0 };
    const weatherCounts = {};

    liveData.forEach((item) => {
      if (item.congestion_level && congestion[item.congestion_level] !== undefined) {
        congestion[item.congestion_level] += 1;
      }
      if (item.weather) {
        weatherCounts[item.weather] = (weatherCounts[item.weather] || 0) + 1;
      }
    });

    const highRoads = liveData.filter((r) => r.congestion_level === "High");
    let mostCongestedRoad = "None";
    if (highRoads.length > 0) {
      mostCongestedRoad = highRoads[0].road_name;
    } else if (liveData.length > 0) {
      const sortedBySpeed = [...liveData].sort((a, b) => a.average_speed - b.average_speed);
      mostCongestedRoad = sortedBySpeed[0].road_name;
    }

    return {
      totalReadings,
      totalVehicles,
      averageSpeed,
      roadsCovered,
      accidents: accidentsCount,
      congestion,
      weatherCounts,
      mostCongestedRoad,
    };
  }, [liveData, incidentsList]);

  // Download Individual Incident PDF Report
  const handleDownloadIncidentReport = useCallback((incident) => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 32, "F");

      doc.setFontSize(18);
      doc.setTextColor(0, 245, 212);
      doc.text("TRAFFICVISION AI - INCIDENT REPORT", 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`Ref ID: ${incident.id} | Generated: ${new Date().toLocaleString()}`, 14, 26);

      // Section 1: Incident Summary
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Incident Details & Status", 14, 44);

      const incidentDetails = [
        ["Field", "Detail"],
        ["Incident Reference", incident.id],
        ["Incident Type", incident.alert_type],
        ["Location / Road", incident.location],
        ["Severity Level", incident.severity.toUpperCase()],
        ["Current Status", incident.status.toUpperCase()],
        ["Reported Time", new Date(incident.created_at).toLocaleString()],
        ["Description", incident.description],
      ];

      autoTable(doc, {
        startY: 48,
        head: [incidentDetails[0]],
        body: incidentDetails.slice(1),
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: [0, 245, 212], fontStyle: "bold" },
        styles: { fontSize: 9.5, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
      });

      // Section 2: Associated Traffic Telemetry
      const currentY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Associated Live Traffic Telemetry", 14, currentY);

      const telemetryData = [
        ["Road Name", incident.location],
        ["Average Speed", `${incident.average_speed} km/h`],
        ["Vehicle Count", `${incident.vehicle_count} vehicles`],
        ["Congestion Level", incident.congestion_level],
        ["Weather Condition", incident.weather],
      ];

      autoTable(doc, {
        startY: currentY + 4,
        head: [["Telemetry Metric", "Recorded Value"]],
        body: telemetryData,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        styles: { fontSize: 9.5, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
      });

      // Footer Note
      const footerY = doc.lastAutoTable.finalY + 18;
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Official Incident Log generated from TrafficVision AI Monitoring System (GET /alerts/ & GET /traffic/live).",
        14,
        footerY
      );

      doc.save(`Incident_Report_${incident.id}_${incident.location.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("Incident PDF download failed:", err);
      alert("Failed to download incident report PDF.");
    }
  }, []);

  // Export Global CSV
  const handleExportCSV = useCallback(() => {
    if (!liveData || liveData.length === 0) {
      alert("No live traffic data available to export.");
      return;
    }

    try {
      const headers = [
        "Road Name",
        "Vehicle Count",
        "Average Speed (km/h)",
        "Congestion Level",
        "Weather",
        "Accident Reported",
        "Recorded Time",
      ];

      const rows = liveData.map((r) => [
        `"${r.road_name || ""}"`,
        r.vehicle_count ?? 0,
        r.average_speed ?? 0,
        `"${r.congestion_level || "N/A"}"`,
        `"${r.weather || "N/A"}"`,
        r.accident ? "YES" : "NO",
        `"${r.recorded_at ? new Date(r.recorded_at).toLocaleString() : new Date().toLocaleString()}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `live_traffic_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("CSV Export failed:", err);
      alert("Failed to export CSV report.");
    }
  }, [liveData]);

  // Export Global PDF
  const handleExportPDF = useCallback(() => {
    if (!liveData || liveData.length === 0) {
      alert("No live traffic data available to export.");
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(0, 212, 255);
      doc.text("TRAFFICVISION AI", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Live Traffic Analytics & Operations Report", 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Data Source: GET /traffic/live (Real-time Endpoint)`, 14, 44);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 48, 196, 48);

      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(`Total Monitored Roads: ${stats.roadsCovered}`, 14, 56);
      doc.text(`Total Vehicle Count: ${stats.totalVehicles.toLocaleString()}`, 14, 63);
      doc.text(`Network Average Speed: ${stats.averageSpeed} km/h`, 105, 56);
      doc.text(`Active Incidents: ${stats.accidents}`, 105, 63);

      const tableData = liveData.map((r) => [
        r.road_name,
        r.vehicle_count,
        `${r.average_speed} km/h`,
        r.congestion_level,
        r.weather,
        r.accident ? "ACCIDENT" : "CLEAR",
        r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString() : "--",
      ]);

      autoTable(doc, {
        startY: 72,
        head: [["Road Name", "Vehicles", "Avg Speed", "Congestion", "Weather", "Accident", "Time"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], textColor: [0, 245, 212], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      doc.save(`TrafficVision_Live_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF report.");
    }
  }, [liveData, stats]);

  return {
    liveData,
    alertsData,
    incidentsList,
    loading,
    error,
    lastUpdated,
    stats,
    fetchLiveData,
    handleDownloadIncidentReport,
    handleExportCSV,
    handleExportPDF,
  };
}

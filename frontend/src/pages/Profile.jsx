import { useEffect } from "react";
import Layout from "../components/admin/Layout";
import OperatorLayout from "../components/OperatorLayout";
import CommuterLayout from "../components/CommuterLayout";

const roleLabels = { admin: "Administrator", operator: "Operator", commuter: "Commuter" };

export default function Profile() {
  const rawUsername = localStorage.getItem("username") || "User";
  const username = rawUsername.replace(/\s*\([^)]*\)/g, "").trim();
  const role = localStorage.getItem("role") || "commuter";
  const email = localStorage.getItem("email") || "Not available";

  useEffect(() => {
    if (window.location.hash === "#settings") {
      document.getElementById("settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const renderProfileContent = () => (
    <main className="profile-page" style={{ padding: "16px 20px" }}>
      <section className="profile-card" style={{ padding: "20px", borderRadius: "14px", background: "rgba(17, 29, 50, 0.72)", border: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "16px" }}>
        <p className="profile-eyebrow" style={{ color: "#00d4ff", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>TrafficVision AI</p>
        <h1 style={{ fontSize: "24px", margin: "8px 0" }}>{username}</h1>
        <p style={{ color: "#9fb2cb", fontSize: "13px" }}>{roleLabels[role] || role}</p>
        <span style={{ color: "#8fa2c0", fontSize: "12px" }}>{email}</span>
      </section>

      <section id="settings" className="profile-card profile-settings" style={{ padding: "20px", borderRadius: "14px", background: "rgba(17, 29, 50, 0.72)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <p className="profile-eyebrow" style={{ color: "#00d4ff", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Settings</p>
        <h2 style={{ fontSize: "18px", margin: "8px 0" }}>Account Preferences</h2>
        <p style={{ fontSize: "13px", color: "#d6e8ff" }}>Email: {email}</p>
        <p style={{ fontSize: "13px", color: "#d6e8ff" }}>Role: {roleLabels[role] || role}</p>
      </section>
    </main>
  );

  if (role === "admin") {
    return <Layout>{renderProfileContent()}</Layout>;
  }

  if (role === "operator") {
    return <OperatorLayout title="User Profile & Settings">{renderProfileContent()}</OperatorLayout>;
  }

  return <CommuterLayout>{renderProfileContent()}</CommuterLayout>;
}

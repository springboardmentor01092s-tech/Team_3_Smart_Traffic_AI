import { useEffect } from "react";

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

  return (
    <main className="profile-page">
      <section className="profile-card">
        <p className="profile-eyebrow">TrafficVision AI</p>
        <h1>{username}</h1>
        <p>{roleLabels[role] || role}</p>
        <span>{email}</span>
      </section>

      <section id="settings" className="profile-card profile-settings">
        <p className="profile-eyebrow">Settings</p>
        <h2>Account Preferences</h2>
        <p>Email: {email}</p>
        <p>Role: {roleLabels[role] || role}</p>
      </section>
    </main>
  );
}

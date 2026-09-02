import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Bell, Clock3 } from "lucide-react";
import UserMenu from "./UserMenu";
import "../styles/commuterDashboard.css";

export default function CommuterLayout({ children }) {
  const navigate = useNavigate();
  const rawUsername = localStorage.getItem("username") || "User";
  const username = rawUsername.replace(/\s*\([^)]*\)/g, "").trim();

  const [timeStr, setTimeStr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate("/prediction");
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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

        <div className="top-middle">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>

        <div className="top-right">
          <motion.div whileHover={{ scale: 1.05 }} className="clock">
            <Clock3 size={18} />
            <span>{timeStr}</span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            className="icon-btn notification"
            onClick={() => navigate("/alerts")}
            style={{ cursor: "pointer" }}
            title="View Alerts"
          >
            <Bell size={20} />
            <span className="badge">3</span>
          </motion.button>
          <UserMenu />
        </div>
      </motion.header>

      <nav className="commuter-nav" aria-label="Commuter navigation">
        <NavLink to="/commuter" end>
          Home
        </NavLink>
        <NavLink to="/live-map">Live Traffic</NavLink>
        <NavLink to="/prediction">Prediction</NavLink>
        <NavLink to="/prediction">Routes</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>

      <div
        className="dashboard-container"
        style={{ padding: "16px 20px", maxWidth: "1300px", margin: "0 auto" }}
      >
        {children}
      </div>
    </div>
  );
}

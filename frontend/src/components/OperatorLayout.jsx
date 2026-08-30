import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock3, Bell } from "lucide-react";
import OperatorSidebar from "./OperatorSidebar";
import UserMenu from "./UserMenu";
import "../styles/operatorDashboard.css";

export default function OperatorLayout({ children, title = "AI Traffic Operations Center" }) {
  const [time, setTime] = useState("");
  const rawUsername = localStorage.getItem("username") || "Operator";
  const username = rawUsername.replace(/\s*\([^)]*\)/g, "").trim();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="operator-layout">
      <OperatorSidebar />

      <div className="operator-main-wrapper">
        <motion.header
          className="operator-topbar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="top-left">
            <h1>{title}</h1>
            <span>Welcome back, {username}</span>
          </div>

          <div className="top-middle">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Search cameras, roads, alerts..." />
            </div>
          </div>

          <div className="top-right">
            <div className="clock">
              <Clock3 size={16} />
              <span>{time}</span>
            </div>

            <button type="button" className="icon-btn notification" title="Notifications">
              <Bell size={18} />
              <span className="badge">5</span>
            </button>

            <UserMenu />
          </div>
        </motion.header>

        <main className="operator-page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

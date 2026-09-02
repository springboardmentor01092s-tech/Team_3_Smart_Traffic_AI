import { motion } from "framer-motion";
import {
    Search,
    Bell,
    Clock3
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import "../../styles/admin/topbar.css";
import UserMenu from "../UserMenu";

export default function Topbar() {
    const navigate = useNavigate();
    const rawUsername = localStorage.getItem("username") || "Admin";
    const username = rawUsername.replace(/\s*\([^)]*\)/g, "").trim();

    const [time, setTime] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchKeyDown = (e) => {
      if (e.key === "Enter" && searchQuery.trim()) {
        navigate(`/admin/alerts?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    };

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
        <motion.header
            className="topbar"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="top-left">
                <div>
                    <h1>AI Traffic Command Center</h1>
                    <span>Welcome back, {username}</span>
                </div>
            </div>

            <div className="top-middle">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search roads, alerts, cameras..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
            </div>

            <div className="top-right">
                <motion.div whileHover={{ scale: 1.08 }} className="clock">
                    <Clock3 size={18} />
                    <span>{time}</span>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.08 }}
                    className="icon-btn notification"
                    onClick={() => navigate("/admin/alerts")}
                    style={{ cursor: "pointer" }}
                    title="View Notifications & Alerts"
                >
                    <Bell size={20} />
                    <span className="badge">4</span>
                </motion.button>

                <UserMenu />
            </div>
        </motion.header>
    );
}

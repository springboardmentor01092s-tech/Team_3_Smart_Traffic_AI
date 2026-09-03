import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Map,
    BrainCircuit,
    TriangleAlert,
    BarChart3,
    FileText,
    LogOut,
    ChevronLeft,
    ChevronRight,
    TrafficCone,
    Menu,
    X
} from "lucide-react";

import { useNavigate, NavLink } from "react-router-dom";
import { useState } from "react";
import "../../styles/admin/sidebar.css";

const adminMenuItems = [
    { title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin" },
    { title: "Live Traffic", icon: <Map size={18} />, path: "/admin/live-traffic" },
    { title: "Prediction", icon: <BrainCircuit size={18} />, path: "/admin/prediction" },
    { title: "Alerts", icon: <TriangleAlert size={18} />, path: "/admin/alerts" },
    { title: "Analytics", icon: <BarChart3 size={18} />, path: "/admin/analytics" },
    { title: "Reports", icon: <FileText size={18} />, path: "/admin/reports" }
];

export default function Sidebar({
    menuItems = adminMenuItems,
    profile = { initial: "A", name: "Admin", role: "Super Administrator" }
}) {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        ["token", "role", "username", "email"].forEach((key) => localStorage.removeItem(key));
        navigate("/", { replace: true });
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <Menu size={20} />
            </button>

            {mobileOpen && (
                <div className="sidebar-backdrop" onClick={closeMobile} />
            )}

            <motion.aside
                className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
                animate={{ width: collapsed ? 68 : 200 }}
                transition={{ duration: 0.35 }}
            >
                <div className="sidebar-top">
                    <div className="logo-wrapper">
                        <div className="logo-circle">
                            <TrafficCone size={18} />
                        </div>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="logo-text"
                            >
                                <h2>Traffic AI</h2>
                                <span>Command Center</span>
                            </motion.div>
                        )}
                    </div>

                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    <button
                        className="mobile-close-btn"
                        onClick={closeMobile}
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="system-status">
                    <div className="pulse" />
                    {!collapsed && <span>System Online</span>}
                </div>

                <nav>
                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            onClick={closeMobile}
                            className={({ isActive }) =>
                                isActive && !item.path.includes("#")
                                    ? "menu-item active"
                                    : "menu-item"
                            }
                        >
                            <motion.div
                                whileHover={{ scale: 1.08, rotate: -5 }}
                                className="icon"
                            >
                                {item.icon}
                            </motion.div>
                            {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div
                        className="profile-card"
                        onClick={() => {
                            closeMobile();
                            navigate("/profile");
                        }}
                        style={{ cursor: "pointer" }}
                        title="View Profile"
                    >
                        <div className="avatar">{profile.initial}</div>
                        {!collapsed && (
                            <div>
                                <h4>{profile.name?.replace(/\s*\([^)]*\)/g, "").trim()}</h4>
                                <p>{profile.role}</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={16} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
}

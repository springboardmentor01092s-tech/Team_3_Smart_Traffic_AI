import {
  Activity,
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Map,
  TriangleAlert,
} from "lucide-react";
import Sidebar from "./admin/Sidebar";

const operatorMenuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    path: "/operator",
  },
  { title: "Live Traffic", icon: <Map size={18} />, path: "/operator/live-traffic" },
  {
    title: "Prediction",
    icon: <BrainCircuit size={18} />,
    path: "/operator/prediction",
  },
  {
    title: "Alerts",
    icon: <TriangleAlert size={18} />,
    path: "/operator/alerts",
  },
  {
    title: "Incidents",
    icon: <Activity size={18} />,
    path: "/operator/alerts",
  },
  { title: "Reports", icon: <FileText size={18} />, path: "/operator/reports" },
];

export default function OperatorSidebar() {
  return (
    <Sidebar
      menuItems={operatorMenuItems}
      profile={{ initial: "O", name: "Operator", role: "Traffic Operator" }}
    />
  );
}

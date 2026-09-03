import { useLocation } from "react-router-dom";
import Layout from "../../components/admin/Layout";
import OperatorLayout from "../../components/OperatorLayout";
import CommuterLayout from "../../components/CommuterLayout";
import TrafficReportContent from "../../components/reports/TrafficReportContent";

export default function Reports() {
  const location = useLocation();
  const storedRole = localStorage.getItem("role") || "commuter";

  let role = storedRole.toLowerCase();

  if (location.pathname.startsWith("/admin")) {
    role = "admin";
  } else if (location.pathname.startsWith("/operator")) {
    role = "operator";
  } else if (location.pathname.startsWith("/commuter") || location.pathname === "/reports") {
    role = "commuter";
  }

  if (role === "admin") {
    return (
      <Layout>
        <TrafficReportContent theme="admin" />
      </Layout>
    );
  }

  if (role === "operator") {
    return (
      <OperatorLayout title="Traffic Operations Reports">
        <TrafficReportContent theme="operator" />
      </OperatorLayout>
    );
  }

  return (
    <CommuterLayout>
      <TrafficReportContent theme="commuter" />
    </CommuterLayout>
  );
}

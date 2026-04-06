import { useState } from "react";
import WelcomePage from "./WelcomePage";
import Dashboard from "./Dashboard";

export default function App() {
  const [page, setPage] = useState(() => {
    return sessionStorage.getItem("cf_entered") ? "dashboard" : "welcome";
  });

  const enterDashboard = () => {
    sessionStorage.setItem("cf_entered", "1");
    setPage("dashboard");
  };

  const backToWelcome = () => {
    sessionStorage.removeItem("cf_entered");
    setPage("welcome");
  };

  if (page === "welcome") {
    return <WelcomePage onEnter={enterDashboard} />;
  }

  return <Dashboard onLogoClick={backToWelcome} />;
}
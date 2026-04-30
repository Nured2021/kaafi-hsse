import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AI from "./pages/AI";
import Compliance from "./pages/Compliance";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Forms from "./pages/Forms";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("kaafi-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "");
    localStorage.setItem("kaafi-theme", theme);
  }, [theme]);

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />

      <div className="content">
        {page === "dashboard" && <Dashboard onNavigate={setPage} />}
        {page === "ai" && <AI />}
        {page === "forms" && <Forms />}
        {page === "compliance" && <Compliance />}
        {page === "users" && <Users />}
        {page === "settings" && <Settings theme={theme} setTheme={setTheme} />}
      </div>
    </div>
  );
}

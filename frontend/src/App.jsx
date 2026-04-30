import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AI from "./pages/AI";
import Compliance from "./pages/Compliance";
import Users from "./pages/Users";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="app">
      <Sidebar setPage={setPage} />

      <div className="content">
        {page === "dashboard" && <Dashboard />}
        {page === "ai" && <AI />}
        {page === "compliance" && <Compliance />}
        {page === "users" && <Users />}
      </div>
    </div>
  );
}

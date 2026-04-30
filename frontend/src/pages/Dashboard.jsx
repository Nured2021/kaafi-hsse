import { useEffect, useState } from "react";

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [userStats, setUserStats] = useState(null);

  function load() {
    fetch("/api/dashboard").then(r => r.json()).then(setData).catch(() => {});
    fetch("/api/ai/runs").then(r => r.json()).then(setRuns).catch(() => {});
    fetch("/api/incidents").then(r => r.json()).then(setIncidents).catch(() => {});
    fetch("/api/users/stats").then(r => r.json()).then(setUserStats).catch(() => {});
  }

  useEffect(load, []);

  async function clearHistory() {
    await fetch("/api/ai/runs", { method: "DELETE" });
    await fetch("/api/incidents", { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>KAAFI HSSE Dashboard</h1>
      <p className="page-subtitle">Real-time safety management overview</p>

      <div className="grid">
        {/* Risk Assessment */}
        <div className="glass-card">
          <h3>⚠️ Risk Assessment</h3>
          <div className="card-value">{data?.aiAssessments ?? "—"}</div>
          <div className="card-label">Active hazards detected</div>
          <div className="btn-group">
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate("ai")}>
              Run New
            </button>
          </div>
        </div>

        {/* JSA Builder */}
        <div className="glass-card">
          <h3>📋 JSA &amp; Permits (PTW)</h3>
          <div className="card-value">{runs.length}</div>
          <div className="card-label">Total analyses completed</div>
          <div className="btn-group">
            <button className="btn btn-success btn-sm" onClick={() => onNavigate("ai")}>
              Build New JSA
            </button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="glass-card">
          <h3>🔗 Pipeline</h3>
          <p style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
            {data?.pipeline?.join(" → ") || "—"}
          </p>
          <div className="card-label" style={{ marginTop: 8 }}>Sequential AI flow</div>
        </div>

        {/* Incident History */}
        <div className="glass-card">
          <h3>🚨 Incident History</h3>
          <div className="card-value">{incidents.length + runs.length}</div>
          <div className="card-label">Total logged events</div>
          <div className="btn-group">
            <button className="btn btn-danger btn-sm" onClick={clearHistory}>
              Clean History
            </button>
          </div>
        </div>

        {/* KAAFI OFFICE — wide card */}
        <div className="glass-card card-wide">
          <h3>🇨🇦 KAAFI Office</h3>
          <p className="card-label">Quick access to documents and standards</p>
          <div className="office-links">
            <button className="office-link" onClick={() => window.open("https://www.office.com/launch/excel", "_blank")}>
              📊 Excel Sheets
            </button>
            <button className="office-link" onClick={() => window.open("https://www.office.com/launch/word", "_blank")}>
              📝 MS Word
            </button>
            <button className="office-link" onClick={() => window.open("https://www.office.com/launch/powerpoint", "_blank")}>
              📈 PowerPoint
            </button>
            <button className="office-link" onClick={() => onNavigate("compliance")}>
              📘 Canadian HSSE Standards
            </button>
          </div>
        </div>

        {/* Platform */}
        <div className="glass-card">
          <h3>🏢 Platform</h3>
          <div className="card-value" style={{ fontSize: "1.2rem" }}>{data?.platform ?? "—"}</div>
          <div className="card-label">Safety management system</div>
        </div>
      </div>

      {/* Personnel Section */}
      <div className="section-title">Personnel Overview</div>
      <div className="grid-4">
        <div className="glass-card">
          <h3>👔 Clients</h3>
          <div className="personnel-value">{userStats?.clients ?? 0}</div>
          <div className="personnel-label">Registered clients</div>
        </div>
        <div className="glass-card">
          <h3>🦺 Contractors</h3>
          <div className="personnel-value">{userStats?.contractors ?? 0}</div>
          <div className="personnel-label">Active contractors</div>
        </div>
        <div className="glass-card">
          <h3>👨‍💼 Managers</h3>
          <div className="personnel-value">{userStats?.managers ?? 0}</div>
          <div className="personnel-label">Site managers</div>
        </div>
        <div className="glass-card">
          <h3>🧑‍🔧 Supervisors</h3>
          <div className="personnel-value">{userStats?.supervisors ?? 0}</div>
          <div className="personnel-label">Field supervisors</div>
        </div>
      </div>

      {/* Recent Runs */}
      {runs.length > 0 && (
        <>
          <div className="section-title">Recent AI Runs</div>
          {runs.slice(0, 5).map(run => (
            <div className="list-item" key={run.id}>
              <strong>{run.input}</strong>
              <div className="list-meta">{new Date(run.created_at).toLocaleString()}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

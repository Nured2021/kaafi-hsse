import { useState } from "react";

export default function Settings({ theme, setTheme }) {
  const [dbStatus, setDbStatus] = useState(null);

  async function checkHealth() {
    try {
      const res = await fetch("/health");
      const data = await res.json();
      setDbStatus(data);
    } catch {
      setDbStatus({ status: "error", message: "Cannot reach server" });
    }
  }

  return (
    <div>
      <h1>Settings</h1>
      <p className="page-subtitle">System control and platform configuration</p>

      <div className="grid-2">
        {/* System Control */}
        <div className="glass-card">
          <h3>🎛️ System Control</h3>

          <div className="settings-row">
            <div>
              <strong>Theme Mode</strong>
              <div className="card-label">Switch between dark and light</div>
            </div>
            <button
              className={`toggle${theme === "dark" ? " on" : ""}`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            />
          </div>

          <div className="settings-row">
            <div>
              <strong>Current Theme</strong>
              <div className="card-label">{theme === "dark" ? "Black (Dark Gradient)" : "White (Soft Light Gradient)"}</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Database Health</strong>
              <div className="card-label">
                {dbStatus
                  ? dbStatus.status === "ok"
                    ? `✅ Connected — ${dbStatus.database}`
                    : `❌ ${dbStatus.message || "Unavailable"}`
                  : "Not checked yet"}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={checkHealth}>
              Check
            </button>
          </div>
        </div>

        {/* Platform Info */}
        <div className="glass-card">
          <h3>ℹ️ Platform Info</h3>

          <div className="settings-row">
            <div>
              <strong>Platform</strong>
              <div className="card-label">KAAFI HSSE</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Version</strong>
              <div className="card-label">0.1.0 (MVP)</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>AI Pipeline</strong>
              <div className="card-label">DeepSeek → Mistral → Gemma → Phi-3</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Backend</strong>
              <div className="card-label">Express + PostgreSQL</div>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <strong>Frontend</strong>
              <div className="card-label">React + Vite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

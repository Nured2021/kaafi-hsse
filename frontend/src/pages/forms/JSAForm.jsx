import { useState } from "react";
import { downloadFormAsText, downloadFormAsCSV, saveForm, aiFillForm } from "./formUtils";

const PPE_OPTIONS = [
  "Safety glasses", "Gloves", "Hard hat", "Respirator",
  "Hearing protection", "Fall protection",
];

const EMPTY_TASK = { task: "", hazards: "", controls: "", rank: "" };

export default function JSAForm() {
  const [mode, setMode] = useState("manual");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [header, setHeader] = useState({
    jobDescription: "", jobNumber: "", jsaNumber: "",
    date: "", location: "", supervisor: "", contractor: "", msds: "No",
  });

  const [tasks, setTasks] = useState([{ ...EMPTY_TASK }]);
  const [ppe, setPpe] = useState({});
  const [emergency, setEmergency] = useState({ fire: "", police: "", hospital: "", musterArea: "" });
  const [contacts, setContacts] = useState({ fire: "", police: "", hospital: "" });

  function updateTask(i, field, val) {
    const updated = [...tasks];
    updated[i] = { ...updated[i], [field]: val };
    setTasks(updated);
  }

  function addTask() { setTasks([...tasks, { ...EMPTY_TASK }]); }
  function removeTask(i) { if (tasks.length > 1) setTasks(tasks.filter((_, idx) => idx !== i)); }

  async function handleAiFill() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setMsg("");
    try {
      const result = await aiFillForm(aiInput);
      setHeader(h => ({ ...h, jobDescription: aiInput, date: new Date().toISOString().slice(0, 10) }));
      setTasks([{
        task: aiInput,
        hazards: result.risk?.substring(0, 500) || "",
        controls: result.jsa?.substring(0, 500) || "",
        rank: "B",
      }]);
      setMsg("AI filled the JSA. Review and adjust fields.");
    } catch (e) {
      setMsg("AI fill failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      await saveForm("jsa", { header, tasks, ppe, emergency, contacts });
      setMsg("JSA saved successfully!");
    } catch (e) {
      setMsg("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadCSV() {
    const headers = ["task", "hazards", "controls", "rank"];
    downloadFormAsCSV("Job_Safety_Analysis", tasks, headers);
  }

  return (
    <div>
      <h1>Job Safety Analysis (JSA)</h1>
      <p className="page-subtitle">Systematic hazard identification for each task step</p>

      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className={`btn ${mode === "manual" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("manual")}>✏️ Manual</button>
        <button className={`btn ${mode === "ai" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("ai")}>🤖 AI</button>
      </div>

      {mode === "ai" && (
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <h3>🤖 AI-Assisted Fill</h3>
          <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Describe the job or task for AI analysis..." style={{ height: 80 }} />
          <button className="btn btn-primary" onClick={handleAiFill} disabled={aiLoading}>{aiLoading ? "Analyzing..." : "Fill with AI"}</button>
        </div>
      )}

      {/* Header */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📋 General Information</h3>
        <div className="grid-2">
          <div><label>Job Description</label><input type="text" value={header.jobDescription} onChange={e => setHeader({ ...header, jobDescription: e.target.value })} /></div>
          <div><label>Job #</label><input type="text" value={header.jobNumber} onChange={e => setHeader({ ...header, jobNumber: e.target.value })} /></div>
          <div><label>JSA #</label><input type="text" value={header.jsaNumber} onChange={e => setHeader({ ...header, jsaNumber: e.target.value })} /></div>
          <div><label>Date</label><input type="text" value={header.date} onChange={e => setHeader({ ...header, date: e.target.value })} placeholder="YYYY-MM-DD" /></div>
          <div><label>Location</label><input type="text" value={header.location} onChange={e => setHeader({ ...header, location: e.target.value })} /></div>
          <div><label>Supervisor</label><input type="text" value={header.supervisor} onChange={e => setHeader({ ...header, supervisor: e.target.value })} /></div>
          <div><label>Contractor</label><input type="text" value={header.contractor} onChange={e => setHeader({ ...header, contractor: e.target.value })} /></div>
          <div>
            <label>MSDS Available</label>
            <select value={header.msds} onChange={e => setHeader({ ...header, msds: e.target.value })}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rank Legend */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📊 Hazard Rank Legend</h3>
        <div className="grid">
          <div><span style={{ color: "var(--danger)", fontWeight: 700 }}>A</span> — Immediate danger to life</div>
          <div><span style={{ color: "var(--warning)", fontWeight: 700 }}>B</span> — Serious hazard, non-immediate</div>
          <div><span style={{ color: "var(--success)", fontWeight: 700 }}>C</span> — Low hazard, minimal risk</div>
        </div>
      </div>

      {/* Task Table */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>⚠️ Task / Hazard / Control Table</h3>
        {tasks.map((t, i) => (
          <div key={i} style={{ background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ color: "var(--accent)", fontSize: "0.85rem" }}>Task {i + 1}</strong>
              {tasks.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeTask(i)}>Remove</button>}
            </div>
            <div className="grid-2">
              <div><label>Task</label><input type="text" value={t.task} onChange={e => updateTask(i, "task", e.target.value)} /></div>
              <div>
                <label>Rank</label>
                <select value={t.rank} onChange={e => updateTask(i, "rank", e.target.value)}>
                  <option value="">Select</option>
                  <option value="A">A - Immediate danger</option>
                  <option value="B">B - Serious hazard</option>
                  <option value="C">C - Low hazard</option>
                </select>
              </div>
            </div>
            <label>Hazards</label>
            <textarea value={t.hazards} onChange={e => updateTask(i, "hazards", e.target.value)} style={{ height: 60 }} />
            <label>Recommended Controls</label>
            <textarea value={t.controls} onChange={e => updateTask(i, "controls", e.target.value)} style={{ height: 60 }} />
          </div>
        ))}
        <button className="btn btn-outline" onClick={addTask}>+ Add Task</button>
      </div>

      {/* PPE */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🦺 PPE Required</h3>
        <div className="grid">
          {PPE_OPTIONS.map(p => (
            <label key={p} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!ppe[p]} onChange={() => setPpe(prev => ({ ...prev, [p]: !prev[p] }))} /> {p}
            </label>
          ))}
        </div>
      </div>

      {/* Emergency */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🚨 Emergency Equipment &amp; Contacts</h3>
        <div className="grid-2">
          <div><label>Fire Extinguisher Location</label><input type="text" value={emergency.fire} onChange={e => setEmergency({ ...emergency, fire: e.target.value })} /></div>
          <div><label>First Aid Kit Location</label><input type="text" value={emergency.hospital} onChange={e => setEmergency({ ...emergency, hospital: e.target.value })} /></div>
          <div><label>Eye Wash Location</label><input type="text" value={emergency.police} onChange={e => setEmergency({ ...emergency, police: e.target.value })} /></div>
          <div><label>Muster Area</label><input type="text" value={emergency.musterArea} onChange={e => setEmergency({ ...emergency, musterArea: e.target.value })} /></div>
        </div>
        <h3 style={{ marginTop: 16 }}>📞 Emergency Contact Numbers</h3>
        <div className="grid">
          <div><label>Fire</label><input type="text" value={contacts.fire} onChange={e => setContacts({ ...contacts, fire: e.target.value })} /></div>
          <div><label>Police</label><input type="text" value={contacts.police} onChange={e => setContacts({ ...contacts, police: e.target.value })} /></div>
          <div><label>Hospital</label><input type="text" value={contacts.hospital} onChange={e => setContacts({ ...contacts, hospital: e.target.value })} /></div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save"}</button>
        <button className="btn btn-primary" onClick={() => downloadFormAsText("Job_Safety_Analysis", { header, tasks, ppe, emergency, contacts })}>📄 Download TXT</button>
        <button className="btn btn-primary" onClick={handleDownloadCSV}>📊 Download CSV</button>
      </div>
      {msg && <p className={msg.includes("fail") ? "error" : "success-msg"}>{msg}</p>}
    </div>
  );
}

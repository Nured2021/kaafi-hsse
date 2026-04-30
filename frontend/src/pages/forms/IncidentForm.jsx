import { useState } from "react";
import { downloadFormAsText, saveForm, aiFillForm } from "./formUtils";

const BODY_PARTS = [
  "Head", "Eye", "Neck", "Shoulder", "Back (upper)", "Back (lower)",
  "Arm", "Elbow", "Wrist", "Hand", "Fingers", "Hip", "Leg", "Knee", "Ankle", "Foot",
];

const ACCIDENT_TYPES = [
  "Repetitive strain", "Acute strain", "Caught in/between",
  "Struck by", "Slip/fall", "Vehicle", "Exposure",
];

const CONDITIONS = [
  "Poor housekeeping", "Defective equipment", "Poor lighting", "Noise", "Fire hazard",
];

const PRACTICES = [
  "Improper lifting", "Unsafe equipment use", "Not using PPE", "Not following procedures",
];

const CORRECTIVE = [
  "Training", "Improve procedures", "Engineering changes", "Inspection improvements", "Housekeeping",
];

export default function IncidentForm() {
  const [mode, setMode] = useState("manual");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [data, setData] = useState({
    lastName: "", firstName: "", jobTitle: "", experience: "",
    address: "", city: "", postalCode: "", division: "",
    dateOccurrence: "", time: "", location: "", dateReported: "",
    incidentType: "",
    whatHappened: "", injuryDetails: "", firstAidTreatment: "",
    bodyParts: {},
    accidentType: "",
    witnessName: "", witnessAddress: "", witnessPhone: "",
    conditions: {},
    practices: {},
    correctiveActions: {},
    sigInvestigator: "", sigManager: "", sigReporter: "",
  });

  function set(key, val) { setData(prev => ({ ...prev, [key]: val })); }
  function toggle(field, item) { setData(prev => ({ ...prev, [field]: { ...prev[field], [item]: !prev[field][item] } })); }

  async function handleAiFill() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setMsg("");
    try {
      const result = await aiFillForm(aiInput);
      set("whatHappened", aiInput);
      set("injuryDetails", result.risk?.substring(0, 500) || "");
      set("dateOccurrence", new Date().toISOString().slice(0, 10));
      set("dateReported", new Date().toISOString().slice(0, 10));
      setMsg("AI analysis applied. Review and complete remaining fields.");
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
      await saveForm("incident_investigation", data);
      setMsg("Incident report saved successfully!");
    } catch (e) {
      setMsg("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Incident Investigation Form</h1>
      <p className="page-subtitle">Document and investigate workplace incidents</p>

      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className={`btn ${mode === "manual" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("manual")}>✏️ Manual</button>
        <button className={`btn ${mode === "ai" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("ai")}>🤖 AI</button>
      </div>

      {mode === "ai" && (
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <h3>🤖 AI-Assisted Fill</h3>
          <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Describe the incident..." style={{ height: 80 }} />
          <button className="btn btn-primary" onClick={handleAiFill} disabled={aiLoading}>{aiLoading ? "Analyzing..." : "Fill with AI"}</button>
        </div>
      )}

      {/* General Info */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>👤 General Information</h3>
        <div className="grid">
          <div><label>Last Name</label><input type="text" value={data.lastName} onChange={e => set("lastName", e.target.value)} /></div>
          <div><label>First Name</label><input type="text" value={data.firstName} onChange={e => set("firstName", e.target.value)} /></div>
          <div><label>Job Title</label><input type="text" value={data.jobTitle} onChange={e => set("jobTitle", e.target.value)} /></div>
          <div><label>Experience</label><input type="text" value={data.experience} onChange={e => set("experience", e.target.value)} /></div>
          <div><label>Address</label><input type="text" value={data.address} onChange={e => set("address", e.target.value)} /></div>
          <div><label>City</label><input type="text" value={data.city} onChange={e => set("city", e.target.value)} /></div>
          <div><label>Postal Code</label><input type="text" value={data.postalCode} onChange={e => set("postalCode", e.target.value)} /></div>
          <div><label>Division</label><input type="text" value={data.division} onChange={e => set("division", e.target.value)} /></div>
          <div><label>Date of Occurrence</label><input type="text" value={data.dateOccurrence} onChange={e => set("dateOccurrence", e.target.value)} placeholder="YYYY-MM-DD" /></div>
          <div><label>Time</label><input type="text" value={data.time} onChange={e => set("time", e.target.value)} /></div>
          <div><label>Location</label><input type="text" value={data.location} onChange={e => set("location", e.target.value)} /></div>
          <div><label>Date Reported</label><input type="text" value={data.dateReported} onChange={e => set("dateReported", e.target.value)} placeholder="YYYY-MM-DD" /></div>
        </div>
      </div>

      {/* Incident Type */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📋 Incident Type</h3>
        <select value={data.incidentType} onChange={e => set("incidentType", e.target.value)}>
          <option value="">Select type</option>
          <option>Hazardous Situation</option>
          <option>Incident</option>
          <option>First Aid</option>
          <option>Health Care</option>
          <option>Lost-Time</option>
          <option>Critical Injury</option>
        </select>
      </div>

      {/* Description */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📝 Description</h3>
        <label>What happened</label>
        <textarea value={data.whatHappened} onChange={e => set("whatHappened", e.target.value)} style={{ height: 80 }} />
        <label>Injury details</label>
        <textarea value={data.injuryDetails} onChange={e => set("injuryDetails", e.target.value)} style={{ height: 60 }} />
        <label>First aid treatment</label>
        <textarea value={data.firstAidTreatment} onChange={e => set("firstAidTreatment", e.target.value)} style={{ height: 60 }} />
      </div>

      {/* Body Part */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🦴 Body Part Injured</h3>
        <div className="grid-4">
          {BODY_PARTS.map(bp => (
            <label key={bp} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: "0.85rem" }}>
              <input type="checkbox" checked={!!data.bodyParts[bp]} onChange={() => toggle("bodyParts", bp)} /> {bp}
            </label>
          ))}
        </div>
      </div>

      {/* Accident Type */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>💥 Accident Type</h3>
        <select value={data.accidentType} onChange={e => set("accidentType", e.target.value)}>
          <option value="">Select</option>
          {ACCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Witnesses */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>👁️ Witnesses</h3>
        <div className="grid">
          <div><label>Name</label><input type="text" value={data.witnessName} onChange={e => set("witnessName", e.target.value)} /></div>
          <div><label>Address</label><input type="text" value={data.witnessAddress} onChange={e => set("witnessAddress", e.target.value)} /></div>
          <div><label>Phone</label><input type="text" value={data.witnessPhone} onChange={e => set("witnessPhone", e.target.value)} /></div>
        </div>
      </div>

      {/* Investigation */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🔍 Investigation — Conditions</h3>
        <div className="grid">
          {CONDITIONS.map(c => (
            <label key={c} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.conditions[c]} onChange={() => toggle("conditions", c)} /> {c}
            </label>
          ))}
        </div>
        <h3 style={{ marginTop: 16 }}>🔍 Investigation — Unsafe Practices</h3>
        <div className="grid">
          {PRACTICES.map(p => (
            <label key={p} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.practices[p]} onChange={() => toggle("practices", p)} /> {p}
            </label>
          ))}
        </div>
      </div>

      {/* Corrective Actions */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>✅ Corrective Actions</h3>
        <div className="grid">
          {CORRECTIVE.map(c => (
            <label key={c} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.correctiveActions[c]} onChange={() => toggle("correctiveActions", c)} /> {c}
            </label>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>✍️ Signatures</h3>
        <div className="grid">
          <div><label>Investigator</label><input type="text" value={data.sigInvestigator} onChange={e => set("sigInvestigator", e.target.value)} /></div>
          <div><label>Manager</label><input type="text" value={data.sigManager} onChange={e => set("sigManager", e.target.value)} /></div>
          <div><label>Reporter</label><input type="text" value={data.sigReporter} onChange={e => set("sigReporter", e.target.value)} /></div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save"}</button>
        <button className="btn btn-primary" onClick={() => downloadFormAsText("Incident_Investigation", data)}>📄 Download TXT</button>
      </div>
      {msg && <p className={msg.includes("fail") ? "error" : "success-msg"}>{msg}</p>}
    </div>
  );
}

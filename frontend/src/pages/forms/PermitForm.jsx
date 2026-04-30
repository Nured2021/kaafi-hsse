import { useState } from "react";
import { downloadFormAsText, saveForm, aiFillForm } from "./formUtils";

const HAZARDS = [
  "SIMOPS", "Oxygen deficiency", "Pinch points", "Working at heights",
  "Chemical exposure", "Electrical", "Falling objects", "Excavation",
  "High pressure", "Noise", "Hot/Cold surfaces", "Repetitive motion",
];

const CONTROLS = [
  "Barricades", "Fire watch", "LOTO", "Air mover",
  "GFCI", "Continuous monitoring", "Competent person",
];

const PPE = [
  "Safety boots", "Hard hat", "Safety glasses", "Gloves",
  "Respirator", "Hearing protection", "Harness", "FRC (8cal)", "FRC (20cal)", "FRC (40cal)",
];

export default function PermitForm() {
  const [mode, setMode] = useState("manual");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [data, setData] = useState({
    workType: "Cold",
    jseaAttached: false,
    issueDate: "", expiryDate: "",
    location: "", company: "", description: "",
    contactPerson: "", phone: "", radioFrequency: "",
    equipCondition: { outOfService: false, depressured: false, drained: false, deenergized: false, lockedOut: false, bleedersOpen: false },
    atmosphere: { oxygen: "", lel: "", co: "", ppm: "" },
    hazards: {},
    controls: {},
    ppe: {},
    authPerforming: "", authIssuing: "", authArea: "", authSimops: "",
    workComplete: "",
  });

  function set(path, val) {
    setData(prev => {
      const copy = { ...prev };
      const parts = path.split(".");
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] };
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = val;
      return copy;
    });
  }

  function toggleMap(mapKey, item) {
    set(mapKey, { ...data[mapKey.split(".").reduce((o, k) => o[k], data)] || {}, [item]: !((data[mapKey.split(".").reduce((o, k) => o[k], data)] || {})[item]) });
  }

  function toggleChecklist(field, item) {
    setData(prev => ({
      ...prev,
      [field]: { ...prev[field], [item]: !prev[field][item] },
    }));
  }

  async function handleAiFill() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setMsg("");
    try {
      const result = await aiFillForm(aiInput);
      set("description", aiInput);
      set("location", "See AI output");
      setMsg("AI analysis complete. Review fields and adjust.");
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
      await saveForm("permit_to_work", data);
      setMsg("Permit saved successfully!");
    } catch (e) {
      setMsg("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Permit to Work</h1>
      <p className="page-subtitle">Not valid &gt; 12 hours without reauthorization · Void if not started within 2 hours of gas test</p>

      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className={`btn ${mode === "manual" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("manual")}>✏️ Manual</button>
        <button className={`btn ${mode === "ai" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("ai")}>🤖 AI</button>
      </div>

      {mode === "ai" && (
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <h3>🤖 AI-Assisted Fill</h3>
          <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Describe the work for AI analysis..." style={{ height: 80 }} />
          <button className="btn btn-primary" onClick={handleAiFill} disabled={aiLoading}>{aiLoading ? "Analyzing..." : "Fill with AI"}</button>
        </div>
      )}

      {/* Section 1: Request */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📝 Section 1: Request</h3>
        <div className="grid-2">
          <div>
            <label>Type of Work</label>
            <select value={data.workType} onChange={e => set("workType", e.target.value)}>
              <option>Hot</option><option>Cold</option><option>Electrical</option>
            </select>
          </div>
          <div>
            <label>JSEA Attached</label>
            <select value={data.jseaAttached ? "Yes" : "No"} onChange={e => set("jseaAttached", e.target.value === "Yes")}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label>Issue Date/Time</label><input type="text" value={data.issueDate} onChange={e => set("issueDate", e.target.value)} /></div>
          <div><label>Expiry Date/Time</label><input type="text" value={data.expiryDate} onChange={e => set("expiryDate", e.target.value)} /></div>
          <div><label>Location</label><input type="text" value={data.location} onChange={e => set("location", e.target.value)} /></div>
          <div><label>Company Name</label><input type="text" value={data.company} onChange={e => set("company", e.target.value)} /></div>
        </div>
        <label>Description of Work</label>
        <textarea value={data.description} onChange={e => set("description", e.target.value)} style={{ height: 80 }} />
      </div>

      {/* Section 2: Contact */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📞 Section 2: Contact</h3>
        <div className="grid">
          <div><label>Contact Person / Supervisor</label><input type="text" value={data.contactPerson} onChange={e => set("contactPerson", e.target.value)} /></div>
          <div><label>Phone Number</label><input type="text" value={data.phone} onChange={e => set("phone", e.target.value)} /></div>
          <div><label>Radio Frequency</label><input type="text" value={data.radioFrequency} onChange={e => set("radioFrequency", e.target.value)} /></div>
        </div>
      </div>

      {/* Section 3: Equipment Condition + Atmosphere */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🔧 Section 3: Equipment Condition</h3>
        <div className="grid">
          {Object.entries({ outOfService: "Out of Service", depressured: "Depressured", drained: "Drained", deenergized: "Deenergized", lockedOut: "Locked Out", bleedersOpen: "Bleeders Open" }).map(([k, v]) => (
            <label key={k} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={data.equipCondition[k]} onChange={() => set(`equipCondition.${k}`, !data.equipCondition[k])} /> {v}
            </label>
          ))}
        </div>
        <h3 style={{ marginTop: 16 }}>🌬️ Atmosphere</h3>
        <div className="grid-4">
          <div><label>% Oxygen</label><input type="text" value={data.atmosphere.oxygen} onChange={e => set("atmosphere.oxygen", e.target.value)} /></div>
          <div><label>% LEL</label><input type="text" value={data.atmosphere.lel} onChange={e => set("atmosphere.lel", e.target.value)} /></div>
          <div><label>CO</label><input type="text" value={data.atmosphere.co} onChange={e => set("atmosphere.co", e.target.value)} /></div>
          <div><label>PPM</label><input type="text" value={data.atmosphere.ppm} onChange={e => set("atmosphere.ppm", e.target.value)} /></div>
        </div>
      </div>

      {/* Section 4: Work Hazards */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>⚠️ Section 4: Work Hazards</h3>
        <div className="grid">
          {HAZARDS.map(h => (
            <label key={h} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.hazards[h]} onChange={() => toggleChecklist("hazards", h)} /> {h}
            </label>
          ))}
        </div>
      </div>

      {/* Section 5: Controls */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🛡️ Section 5: Controls</h3>
        <div className="grid">
          {CONTROLS.map(c => (
            <label key={c} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.controls[c]} onChange={() => toggleChecklist("controls", c)} /> {c}
            </label>
          ))}
        </div>
      </div>

      {/* Section 6: PPE */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>🦺 Section 6: PPE Required</h3>
        <div className="grid">
          {PPE.map(p => (
            <label key={p} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.ppe[p]} onChange={() => toggleChecklist("ppe", p)} /> {p}
            </label>
          ))}
        </div>
      </div>

      {/* Section 7: Authorization */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>✅ Section 7: Authorization</h3>
        <div className="grid-2">
          <div><label>Performing Authority</label><input type="text" value={data.authPerforming} onChange={e => set("authPerforming", e.target.value)} /></div>
          <div><label>Issuing Authority</label><input type="text" value={data.authIssuing} onChange={e => set("authIssuing", e.target.value)} /></div>
          <div><label>Area Authority</label><input type="text" value={data.authArea} onChange={e => set("authArea", e.target.value)} /></div>
          <div><label>SIMOPS Authority</label><input type="text" value={data.authSimops} onChange={e => set("authSimops", e.target.value)} /></div>
        </div>
      </div>

      {/* Section 8: Sign Off */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📝 Section 8: Sign Off</h3>
        <label>Work Status</label>
        <select value={data.workComplete} onChange={e => set("workComplete", e.target.value)}>
          <option value="">Select</option><option value="Complete">Work Complete</option><option value="Incomplete">Work Incomplete</option>
        </select>
      </div>

      <div className="btn-group">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save"}</button>
        <button className="btn btn-primary" onClick={() => downloadFormAsText("Permit_to_Work", data)}>📄 Download TXT</button>
      </div>
      {msg && <p className={msg.includes("fail") ? "error" : "success-msg"}>{msg}</p>}
    </div>
  );
}

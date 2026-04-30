import { useState } from "react";
import { downloadFormAsText, downloadFormAsCSV, saveForm, aiFillForm } from "./formUtils";

const EMPTY_ROW = {
  process: "", hazard: "", legalRef: "", controls: "",
  action: "", residualRisk: "", probability: "", severity: "", rating: "",
};

function calcRating(p, s) {
  const matrix = [
    ["Low", "Low", "Medium", "Medium"],
    ["Low", "Low", "Medium", "High"],
    ["Low", "Medium", "High", "High"],
    ["Medium", "Medium", "High", "High"],
  ];
  const pi = parseInt(p, 10);
  const si = parseInt(s, 10);
  if (pi >= 1 && pi <= 4 && si >= 1 && si <= 4) return matrix[pi - 1][si - 1];
  return "";
}

export default function HazardForm() {
  const [mode, setMode] = useState("manual");
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [header, setHeader] = useState({
    equipment: "", page: "", date: "", department: "", assessedBy: "",
  });

  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);

  function updateRow(idx, field, value) {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "probability" || field === "severity") {
      updated[idx].rating = calcRating(
        field === "probability" ? value : updated[idx].probability,
        field === "severity" ? value : updated[idx].severity,
      );
    }
    setRows(updated);
  }

  function addRow() { setRows([...rows, { ...EMPTY_ROW }]); }
  function removeRow(i) { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); }

  async function handleAiFill() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setMsg("");
    try {
      const result = await aiFillForm(aiInput);
      setHeader(h => ({ ...h, equipment: aiInput, date: new Date().toISOString().slice(0, 10) }));
      setRows([{
        process: aiInput,
        hazard: result.risk?.substring(0, 500) || "",
        legalRef: "See AI Risk Output",
        controls: result.jsa?.substring(0, 500) || "",
        action: result.summary?.substring(0, 300) || "",
        residualRisk: "Review required",
        probability: "3", severity: "3", rating: calcRating("3", "3"),
      }]);
      setMsg("AI filled form fields. Review and adjust as needed.");
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
      await saveForm("hazard_assessment", { header, rows });
      setMsg("Form saved to database successfully!");
    } catch (e) {
      setMsg("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadTxt() {
    downloadFormAsText("Hazard_Identification_Risk_Assessment", { ...header, rows });
  }

  function handleDownloadCSV() {
    const headers = ["process", "hazard", "legalRef", "controls", "action", "residualRisk", "probability", "severity", "rating"];
    downloadFormAsCSV("Hazard_Assessment", rows, headers);
  }

  return (
    <div>
      <h1>Hazard Identification &amp; Risk Assessment</h1>
      <p className="page-subtitle">RACE: Recognize, Assess, Control, Evaluate</p>

      {/* Mode Toggle */}
      <div className="btn-group" style={{ marginBottom: 20 }}>
        <button className={`btn ${mode === "manual" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("manual")}>
          ✏️ Manual Mode
        </button>
        <button className={`btn ${mode === "ai" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("ai")}>
          🤖 AI Mode
        </button>
      </div>

      {/* AI Input */}
      {mode === "ai" && (
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <h3>🤖 AI-Assisted Fill</h3>
          <textarea value={aiInput} onChange={e => setAiInput(e.target.value)}
            placeholder="Describe the work activity or hazard for AI analysis..." style={{ height: 80 }} />
          <button className="btn btn-primary" onClick={handleAiFill} disabled={aiLoading || !aiInput.trim()}>
            {aiLoading ? "Analyzing..." : "Fill with AI"}
          </button>
        </div>
      )}

      {/* Header Fields */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📋 General Information</h3>
        <div className="grid-2">
          <div>
            <label>Equipment / Work Process</label>
            <input type="text" value={header.equipment} onChange={e => setHeader({ ...header, equipment: e.target.value })} />
          </div>
          <div>
            <label>Page #</label>
            <input type="text" value={header.page} onChange={e => setHeader({ ...header, page: e.target.value })} />
          </div>
          <div>
            <label>Date</label>
            <input type="text" value={header.date} onChange={e => setHeader({ ...header, date: e.target.value })} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label>Department</label>
            <input type="text" value={header.department} onChange={e => setHeader({ ...header, department: e.target.value })} />
          </div>
          <div>
            <label>Assessed By</label>
            <input type="text" value={header.assessedBy} onChange={e => setHeader({ ...header, assessedBy: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Risk Matrix Reference */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h3>📊 Risk Matrix Reference</h3>
        <div className="grid-2">
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-heading)" }}>Probability</strong>
            <p className="card-label">4 = Almost Certain · 3 = Likely · 2 = Possibly · 1 = Unlikely</p>
          </div>
          <div>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-heading)" }}>Severity</strong>
            <p className="card-label">4 = Severe · 3 = Major · 2 = Moderate · 1 = Minor</p>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <strong style={{ fontSize: "0.85rem", color: "var(--text-heading)" }}>Hierarchy of Controls</strong>
          <p className="card-label">Elimination → Substitution → Engineering → Administrative → PPE</p>
        </div>
      </div>

      {/* Assessment Table */}
      <div className="glass-card" style={{ marginBottom: 20, overflowX: "auto" }}>
        <h3>⚠️ Hazard Assessment Table</h3>
        {rows.map((row, i) => (
          <div key={i} style={{ background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ color: "var(--accent)", fontSize: "0.85rem" }}>Step {i + 1}</strong>
              {rows.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>Remove</button>}
            </div>
            <div className="grid-2">
              <div>
                <label>Equipment Operation / Work Process</label>
                <input type="text" value={row.process} onChange={e => updateRow(i, "process", e.target.value)} />
              </div>
              <div>
                <label>Existing &amp; Potential Hazard</label>
                <input type="text" value={row.hazard} onChange={e => updateRow(i, "hazard", e.target.value)} />
              </div>
              <div>
                <label>Legal/Standards Reference</label>
                <input type="text" value={row.legalRef} onChange={e => updateRow(i, "legalRef", e.target.value)} />
              </div>
              <div>
                <label>Current Controls / Controls Needed</label>
                <input type="text" value={row.controls} onChange={e => updateRow(i, "controls", e.target.value)} />
              </div>
              <div>
                <label>Action Required</label>
                <input type="text" value={row.action} onChange={e => updateRow(i, "action", e.target.value)} />
              </div>
              <div>
                <label>Residual Risk After Controls</label>
                <input type="text" value={row.residualRisk} onChange={e => updateRow(i, "residualRisk", e.target.value)} />
              </div>
              <div>
                <label>Probability (1-4)</label>
                <select value={row.probability} onChange={e => updateRow(i, "probability", e.target.value)}>
                  <option value="">Select</option>
                  <option value="1">1 - Unlikely</option>
                  <option value="2">2 - Possibly</option>
                  <option value="3">3 - Likely</option>
                  <option value="4">4 - Almost Certain</option>
                </select>
              </div>
              <div>
                <label>Severity (1-4)</label>
                <select value={row.severity} onChange={e => updateRow(i, "severity", e.target.value)}>
                  <option value="">Select</option>
                  <option value="1">1 - Minor</option>
                  <option value="2">2 - Moderate</option>
                  <option value="3">3 - Major</option>
                  <option value="4">4 - Severe</option>
                </select>
              </div>
            </div>
            {row.rating && (
              <div style={{ marginTop: 8, padding: "6px 12px", display: "inline-block", borderRadius: 8,
                background: row.rating === "High" ? "var(--danger)" : row.rating === "Medium" ? "var(--warning)" : "var(--success)",
                color: row.rating === "Medium" ? "#000" : "#fff", fontSize: "0.85rem", fontWeight: 600 }}>
                Risk Rating: {row.rating}
              </div>
            )}
          </div>
        ))}
        <button className="btn btn-outline" onClick={addRow}>+ Add Step</button>
      </div>

      {/* Actions */}
      <div className="btn-group">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save to DB"}</button>
        <button className="btn btn-primary" onClick={handleDownloadTxt}>📄 Download TXT</button>
        <button className="btn btn-primary" onClick={handleDownloadCSV}>📊 Download CSV</button>
      </div>
      {msg && <p className={msg.includes("fail") ? "error" : "success-msg"}>{msg}</p>}
    </div>
  );
}

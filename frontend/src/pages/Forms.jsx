import { useState, useEffect } from "react";
import HazardForm from "./forms/HazardForm";
import PermitForm from "./forms/PermitForm";
import IncidentForm from "./forms/IncidentForm";
import JSAForm from "./forms/JSAForm";

const FORM_LIST = [
  { id: "hazard", icon: "⚠️", title: "Hazard ID & Risk Assessment", desc: "RACE methodology — Recognize, Assess, Control, Evaluate" },
  { id: "permit", icon: "🛠", title: "Permit to Work (PTW)", desc: "Hot/Cold/Electrical work permits with gas testing & authorization" },
  { id: "incident", icon: "🚨", title: "Incident Investigation", desc: "Document injuries, root causes, corrective actions & witnesses" },
  { id: "jsa", icon: "📋", title: "Job Safety Analysis (JSA)", desc: "Task-by-task hazard identification with A/B/C ranking" },
];

export default function Forms() {
  const [activeForm, setActiveForm] = useState(null);
  const [savedForms, setSavedForms] = useState([]);

  useEffect(() => {
    fetch("/api/forms").then(r => r.json()).then(setSavedForms).catch(() => {});
  }, [activeForm]);

  if (activeForm === "hazard") return <div><button className="btn btn-outline btn-sm" onClick={() => setActiveForm(null)} style={{ marginBottom: 16 }}>← Back to Forms</button><HazardForm /></div>;
  if (activeForm === "permit") return <div><button className="btn btn-outline btn-sm" onClick={() => setActiveForm(null)} style={{ marginBottom: 16 }}>← Back to Forms</button><PermitForm /></div>;
  if (activeForm === "incident") return <div><button className="btn btn-outline btn-sm" onClick={() => setActiveForm(null)} style={{ marginBottom: 16 }}>← Back to Forms</button><IncidentForm /></div>;
  if (activeForm === "jsa") return <div><button className="btn btn-outline btn-sm" onClick={() => setActiveForm(null)} style={{ marginBottom: 16 }}>← Back to Forms</button><JSAForm /></div>;

  return (
    <div>
      <h1>HSSE Forms</h1>
      <p className="page-subtitle">Standard safety forms — AI-assisted or manual entry — downloadable offline</p>

      <div className="grid-2">
        {FORM_LIST.map(f => (
          <div className="glass-card" key={f.id} style={{ cursor: "pointer" }} onClick={() => setActiveForm(f.id)}>
            <h3>{f.icon} {f.title}</h3>
            <p className="card-label">{f.desc}</p>
            <div className="btn-group">
              <button className="btn btn-primary btn-sm">Open Form</button>
            </div>
          </div>
        ))}
      </div>

      {savedForms.length > 0 && (
        <>
          <div className="section-title">Recent Submissions ({savedForms.length})</div>
          {savedForms.slice(0, 8).map(s => (
            <div className="list-item" key={s.id}>
              <strong>{s.form_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</strong>
              <div className="list-meta">{new Date(s.created_at).toLocaleString()}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

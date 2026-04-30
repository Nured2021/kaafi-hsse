import { useState } from "react";

const STANDARDS = [
  { category: "Alberta OHS Act", items: [
    { code: "OHS Act Part 1", title: "Interpretation and Application", desc: "Definitions and scope of the Occupational Health and Safety Act." },
    { code: "OHS Act Part 2", title: "Obligations of Employers", desc: "General duties of employers to ensure worker health and safety." },
    { code: "OHS Act Part 3", title: "Obligations of Workers", desc: "Worker duties to follow safety procedures and report hazards." },
    { code: "OHS Act Part 4", title: "Chemical and Biological Hazards", desc: "Controls for exposure to hazardous substances." },
    { code: "OHS Act Part 5", title: "Violence and Harassment", desc: "Prevention of workplace violence and harassment." },
    { code: "OHS Code Part 9", title: "Fall Protection", desc: "Requirements for fall protection systems, guardrails, and travel restraint." },
    { code: "OHS Code Part 5", title: "Confined Spaces", desc: "Entry permits, atmospheric monitoring, and rescue plans." },
    { code: "OHS Code Part 10", title: "Fire and Explosion Hazards", desc: "Hot work permits, flammable storage, ignition control." },
  ]},
  { category: "Canada Federal OHS", items: [
    { code: "CLC Part II", title: "Canada Labour Code Part II", desc: "Federal workplace health and safety obligations." },
    { code: "SOR/86-304", title: "Canada OHS Regulations", desc: "Detailed federal safety regulations for federally regulated workplaces." },
    { code: "WHMIS 2015", title: "Workplace Hazardous Materials", desc: "GHS-aligned classification, labelling, and safety data sheets." },
    { code: "SOR/2019-246", title: "Harassment and Violence Prevention", desc: "Bill C-65 regulations for workplace harassment prevention." },
    { code: "CSA Z1000", title: "OHS Management Systems", desc: "Canadian standard for occupational health and safety management." },
  ]},
  { category: "Safety Codes & Standards", items: [
    { code: "CSA Z259", title: "Fall Protection Equipment", desc: "Standards for harnesses, lanyards, anchors, and lifelines." },
    { code: "CSA Z462", title: "Electrical Safety", desc: "Arc flash hazard analysis and electrical safe work practices." },
    { code: "CSA Z1006", title: "Confined Space Management", desc: "Program requirements for confined space entry." },
    { code: "NFPA 51B", title: "Fire Prevention in Hot Work", desc: "Standard for fire prevention during welding, cutting, and brazing." },
    { code: "CSA Z94.1", title: "Industrial Headwear", desc: "Requirements for hard hats and industrial protective headwear." },
    { code: "CSA Z94.3", title: "Eye and Face Protectors", desc: "Standards for safety glasses, goggles, and face shields." },
  ]},
];

export default function Compliance() {
  const [search, setSearch] = useState("");

  const filtered = STANDARDS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      `${item.code} ${item.title} ${item.desc}`.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div>
      <h1>Compliance Library</h1>
      <p className="page-subtitle">Canadian HSSE standards — Alberta &amp; Federal</p>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search standards, codes, regulations..."
          style={{ paddingLeft: 40 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card">
          <p className="muted">No standards found matching "{search}"</p>
        </div>
      ) : (
        filtered.map(section => (
          <div className="compliance-section" key={section.category}>
            <h2>{section.category}</h2>
            <div className="grid">
              {section.items.map(item => (
                <div className="glass-card" key={item.code}>
                  <h3>{item.code}</h3>
                  <strong style={{ color: "var(--text-heading)", fontSize: "0.9rem" }}>{item.title}</strong>
                  <p className="card-label" style={{ marginTop: 6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

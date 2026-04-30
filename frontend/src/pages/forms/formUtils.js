export function downloadFormAsText(title, data) {
  const lines = [`=== ${title} ===`, `Generated: ${new Date().toLocaleString()}`, ""];

  function flatten(obj, prefix = "") {
    for (const [key, val] of Object.entries(obj)) {
      const label = prefix ? `${prefix} > ${key}` : key;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        flatten(val, label);
      } else if (Array.isArray(val)) {
        lines.push(`${label}:`);
        val.forEach((item, i) => {
          if (typeof item === "object") {
            lines.push(`  [${i + 1}]`);
            for (const [k, v] of Object.entries(item)) {
              lines.push(`    ${k}: ${v || ""}`);
            }
          } else {
            lines.push(`  - ${item}`);
          }
        });
      } else {
        lines.push(`${label}: ${val || ""}`);
      }
    }
  }

  flatten(data);
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFormAsCSV(title, rows, headers) {
  const escape = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(",")];
  for (const row of rows) {
    csv.push(headers.map((h) => escape(row[h] || "")).join(","));
  }
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveForm(formType, data) {
  const res = await fetch("/api/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formType, data }),
  });
  if (!res.ok) throw new Error("Failed to save form");
  return res.json();
}

export async function aiFillForm(description) {
  const res = await fetch("/api/full-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: description }),
  });
  if (!res.ok) throw new Error("AI analysis failed");
  return res.json();
}

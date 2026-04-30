import { useState } from "react";

export default function AI() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/full-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail.message || "Analysis failed");
      }

      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Analysis</h1>
      <p className="page-subtitle">Sequential HSSE pipeline — DeepSeek → Mistral → Gemma → Phi-3</p>

      <div className="glass-card form-card">
        <h3>🤖 Describe the hazard or work activity</h3>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Example: Hot work on a storage tank near active forklift traffic..."
        />

        <button className="btn btn-primary" onClick={run} disabled={loading || !input.trim()}>
          {loading ? "⏳ Analyzing..." : "Run Full Analysis"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result" style={{ marginTop: 24 }}>
          <h3>⚠️ Risk Analysis</h3>
          <pre>{result.risk || "No output returned."}</pre>

          <h3>📋 JSA</h3>
          <pre>{result.jsa || "No output returned."}</pre>

          <h3>📄 Documents</h3>
          <pre>{result.documents || "No output returned."}</pre>

          <h3>📊 Summary</h3>
          <pre>{result.summary || "No output returned."}</pre>
        </div>
      )}
    </div>
  );
}

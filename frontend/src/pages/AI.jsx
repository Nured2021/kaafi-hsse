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

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe hazard..."
      />

      <button onClick={run} disabled={loading || !input.trim()}>
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h3>Risk</h3>
          <pre>{result.risk}</pre>

          <h3>JSA</h3>
          <pre>{result.jsa}</pre>

          <h3>Documents</h3>
          <pre>{result.documents}</pre>

          <h3>Summary</h3>
          <pre>{result.summary}</pre>
        </div>
      )}
    </div>
  );
}

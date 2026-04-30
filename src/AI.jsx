import { useState } from "react";

function AI() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/full-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        risk: "Model offline or failed",
        jsa: "Model offline or failed",
        docs: "Model offline or failed",
        summary: "Model offline or failed"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>KAAFI HSSE Platform</h1>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="SCAFFOLDING WORK AT HEIGHT"
      />
      <button onClick={runAnalysis} disabled={loading || !text.trim()}>
        {loading ? "Running..." : "Run Analysis"}
      </button>

      {result && (
        <section className="results">
          <article>
            <h2>Risk output</h2>
            <pre>{result.risk}</pre>
          </article>
          <article>
            <h2>JSA output</h2>
            <pre>{result.jsa}</pre>
          </article>
          <article>
            <h2>Docs output</h2>
            <pre>{result.docs}</pre>
          </article>
          <article>
            <h2>Summary output</h2>
            <pre>{result.summary}</pre>
          </article>
        </section>
      )}
    </main>
  );
}

export default AI;

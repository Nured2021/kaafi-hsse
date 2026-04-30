import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function AiPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitAnalysis(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/full-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const detail = await response.json();
        throw new Error(detail.message || 'Analysis failed');
      }

      setResult(await response.json());
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel ai-panel">
      <div className="panel-heading">
        <p className="eyebrow">AI page</p>
        <h2>KAAFI HSSE Full Analysis</h2>
        <p className="muted">DeepSeek risk, Mistral JSA, Gemma documents, then Phi-3 summary.</p>
      </div>
      <form onSubmit={submitAnalysis}>
        <label htmlFor="hsse-input">Work activity or safety concern</label>
        <textarea
          id="hsse-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Example: Hot work on a storage tank near active forklift traffic..."
          rows="8"
        />
        <button disabled={loading || !input.trim()} type="submit">
          {loading ? 'Analyzing...' : 'Run Full Analysis'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="results">
          <ModelStatus status={result.status} />
          <ResultBlock title="Risk Analysis" content={result.risk} />
          <ResultBlock title="JSA" content={result.jsa} />
          <ResultBlock title="Documents" content={result.documents} />
          <ResultBlock title="Summary" content={result.summary} />
        </div>
      )}
    </section>
  );
}

function ModelStatus({ status = {} }) {
  return (
    <div className="status-grid">
      {Object.entries(status).map(([model, value]) => (
        <article className={`status-card ${value === 'OK' ? 'ok' : 'failed'}`} key={model}>
          <strong>{model}</strong>
          <span>{value}</span>
        </article>
      ))}
    </div>
  );
}

function ResultBlock({ title, content }) {
  return (
    <article className="result-block">
      <h3>{title}</h3>
      <pre>{content || 'No output returned.'}</pre>
    </article>
  );
}

function App() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">KAAFI HSSE</p>
        <h1>Clean linear safety analysis</h1>
        <p>One backend, one endpoint, one real Ollama pipeline.</p>
      </header>
      <div className="layout">
        <AiPage />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

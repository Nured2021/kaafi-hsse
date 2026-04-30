import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      const [dashboardResponse, runsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard`),
        fetch(`${API_BASE_URL}/api/ai/runs`),
      ]);

      setDashboard(await dashboardResponse.json());
      setRuns(await runsResponse.json());
    }

    loadDashboard().catch(console.error);
  }, []);

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Dashboard</p>
        <h2>KAAFI HSSE overview</h2>
      </div>
      <div className="stats">
        <article>
          <span>{dashboard?.aiAssessments ?? '--'}</span>
          <p>AI assessments</p>
        </article>
        <article>
          <span>{runs.length}</span>
          <p>Recent saved runs</p>
        </article>
      </div>
      <div className="recent">
        <h3>Recent AI runs</h3>
        {runs.length === 0 ? (
          <p className="muted">No saved analysis runs yet.</p>
        ) : (
          runs.map((run) => (
            <div className="run-card" key={run.id}>
              <strong>{new Date(run.created_at).toLocaleString()}</strong>
              <p>{run.input}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

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
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
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
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">AI page</p>
        <h2>Sequential HSSE analysis</h2>
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
          {loading ? 'Analyzing...' : 'Run AI pipeline'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="results">
          <ResultBlock title="Risk - deepseek-r1:7b" content={result.risk} />
          <ResultBlock title="JSA - mistral:7b-instruct" content={result.jsa} />
          <ResultBlock title="Documents - gemma:7b" content={result.documents} />
          <ResultBlock title="Summary - phi3:medium" content={result.summary} />
        </div>
      )}
    </section>
  );
}

function ResultBlock({ title, content }) {
  return (
    <article className="result-block">
      <h3>{title}</h3>
      <pre>{content}</pre>
    </article>
  );
}

function App() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">KAAFI HSSE Platform</p>
        <h1>Safety management with a simple local AI pipeline</h1>
        <p>
          A clean starter platform for HSSE dashboarding and sequential Ollama analysis.
        </p>
      </header>
      <div className="layout">
        <Dashboard />
        <AiPage />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

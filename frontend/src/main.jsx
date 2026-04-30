import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  buildCleanDownload,
  KAAFI_CONFIG,
  getAssistantPrompt,
  getEmpathyValidationMessage,
  injectKaafiLogic,
} from './core/kaafi_bridge/bridge.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
  const kaafiLogic = injectKaafiLogic({ input });
  const isHighRisk = kaafiLogic.risk.level === 'HIGH';

  async function submitAnalysis(event) {
    event.preventDefault();
    if (!input.trim()) {
      setError(getEmpathyValidationMessage('input'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/full-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: kaafiLogic.cleanedInput }),
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

  function downloadSmartClean() {
    const cleaned = buildCleanDownload({ input, result });
    const blob = new Blob([cleaned], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'kaafi-hsse-clean-analysis.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className={`panel ai-panel ${isHighRisk ? 'high-risk-panel' : ''}`}
      style={{ borderColor: kaafiLogic.risk.color }}
    >
      <div className="panel-heading">
        <p className="eyebrow">AI page</p>
        <h2>{KAAFI_CONFIG.brand} Safety Assistant</h2>
        <p className="assistant-prompt">{getAssistantPrompt()}</p>
      </div>
      <div className="risk-strip" style={{ backgroundColor: kaafiLogic.risk.color }}>
        <strong>{kaafiLogic.risk.level} risk</strong>
        <span>{kaafiLogic.risk.action}</span>
      </div>
      {isHighRisk && (
        <div className="permit-callout">
          Permit to Work is prioritized before this job starts.
        </div>
      )}
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
          <button className="secondary-button" onClick={downloadSmartClean} type="button">
            Smart Clean Download
          </button>
          <ResultBlock title="KAAFI Header" content={kaafiLogic.header} />
          <ResultBlock title="Risk Analysis" content={result.risk} />
          <ResultBlock title="JSA" content={result.jsa} />
          <ResultBlock title="Documents" content={result.documents} />
          <ResultBlock title="Summary" content={result.summary} />
        </div>
      )}
    </section>
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
        <p className="eyebrow">{KAAFI_CONFIG.header}</p>
        <h1>{KAAFI_CONFIG.brand}</h1>
        <p>
          Smart HSSE support for clean, branded, user-focused JSA and risk analysis.
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

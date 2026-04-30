import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {data && (
        <div className="cards">
          <div className="card">
            <h3>Total Analyses</h3>
            <p>{data.aiAssessments}</p>
          </div>

          <div className="card">
            <h3>Pipeline</h3>
            <p>{data.pipeline.join(" → ")}</p>
          </div>

          <div className="card">
            <h3>Platform</h3>
            <p>{data.platform}</p>
          </div>
        </div>
      )}
    </div>
  );
}

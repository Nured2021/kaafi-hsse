export default function Sidebar({ setPage }) {
  return (
    <div className="sidebar">
      <h2>KAAFI</h2>

      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("ai")}>AI Analysis</button>
      <button onClick={() => setPage("users")}>Users</button>
      <button onClick={() => setPage("compliance")}>Compliance</button>
    </div>
  );
}

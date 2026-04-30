export default function Sidebar({ page, setPage }) {
  const nav = (target) => ({
    className: `sidebar-btn${page === target ? " active" : ""}`,
    onClick: () => setPage(target),
  });

  return (
    <div className="sidebar">
      <div className="sidebar-logo">KAAFI</div>
      <div className="sidebar-subtitle">HSSE Platform</div>

      <div className="sidebar-section">Main</div>
      <button {...nav("dashboard")}>📊 Dashboard</button>
      <button {...nav("ai")}>🤖 AI Analysis</button>

      <div className="sidebar-section">Safety</div>
      <button {...nav("forms")}>📝 HSSE Forms</button>
      <button {...nav("compliance")}>📘 Compliance</button>

      <div className="sidebar-section">Management</div>
      <button {...nav("users")}>👤 Users</button>

      <div className="sidebar-spacer" />
      <button {...nav("settings")}>⚙️ Settings</button>
    </div>
  );
}

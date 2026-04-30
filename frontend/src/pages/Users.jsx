import { useEffect, useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("worker");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function loadUsers() {
    fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => {});
  }

  useEffect(loadUsers, []);

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!name.trim() || !email.trim()) {
      setErr("Name and email are required");
      return;
    }

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }

      setMsg("User registered successfully!");
      setName("");
      setEmail("");
      setRole("worker");
      loadUsers();
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div>
      <h1>User Management</h1>
      <p className="page-subtitle">Register and manage platform users</p>

      <div className="grid-2">
        {/* Registration Form */}
        <div className="glass-card form-card">
          <h3>📝 Sign Up / Register</h3>

          <form onSubmit={handleRegister}>
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Smith"
            />

            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
            />

            <label htmlFor="reg-role">Role</label>
            <select id="reg-role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="worker">Worker</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="contractor">Contractor</option>
              <option value="client">Client</option>
            </select>

            <button className="btn btn-primary" type="submit">Register User</button>
          </form>

          {msg && <p className="success-msg">{msg}</p>}
          {err && <p className="error">{err}</p>}
        </div>

        {/* User List */}
        <div className="glass-card">
          <h3>👥 Registered Users ({users.length})</h3>

          {users.length === 0 ? (
            <p className="muted">No users registered yet.</p>
          ) : (
            users.map(u => (
              <div className="list-item" key={u.id}>
                <strong>{u.name}</strong>
                <div className="list-meta">
                  {u.email} · {u.role} · {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

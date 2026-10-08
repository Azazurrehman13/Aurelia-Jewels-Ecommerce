import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./admin.css";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Enter your admin email and password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin-login", form);
      login(data); // the redirect above takes over
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="al-wrap">
      <form className="al-card" onSubmit={handleSubmit} noValidate>
        <div className="al-gem">◆</div>
        <h1>Admin sign in</h1>
        <p>Aurelia Jewels management panel</p>

        <label>Admin email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="admin@example.com"
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter password"
          autoComplete="current-password"
        />

        {error && <p className="ad-error">{error}</p>}

        <button className="ad-btn full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <Link to="/" className="al-back">← Back to store</Link>
      </form>
    </div>
  );
}
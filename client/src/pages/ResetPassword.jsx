import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useDialog } from "../context/DialogContext";
import logo from "../assets/Goldlogo.png";
import "./Recover.css";

const rules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One capital letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useDialog();

  const [status, setStatus] = useState("checking"); // checking | valid | invalid
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // is the link still valid?
  useEffect(() => {
    api
      .get(`/auth/reset-password/${token}`)
      .then(() => setStatus("valid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const rulesOk = rules.every((r) => r.test(password));
  const match = password !== "" && password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!rulesOk) return setError("Your password does not meet all the requirements");
    if (!match) return setError("The two passwords do not match");

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password updated. Please log in with your new password.");
      navigate("/auth", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset your password");
      setLoading(false);
    }
  };

  return (
    <div className="rc-wrap">
      <div className="rc-card">
        <span className="rc-badge">
          <img src={logo} alt="Aurelia Jewels logo" />
        </span>

        {status === "checking" && <p>Checking your link...</p>}

        {status === "invalid" && (
          <>
            <div className="rc-icon bad">!</div>
            <h1>Link expired</h1>
            <p>This reset link is invalid or has expired. Reset links work for 30 minutes and only once.</p>
            <Link to="/forgot-password" className="rc-btn">Get a new link</Link>
            <Link to="/auth" className="rc-link">← Back to login</Link>
          </>
        )}

        {status === "valid" && (
          <>
            <h1>Choose a new password</h1>
            <p>Pick a strong password you have not used before.</p>

            <form onSubmit={submit} noValidate>
              <label>New password</label>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />

              <ul className="rc-checklist">
                {rules.map((r) => (
                  <li key={r.label} className={r.test(password) ? "ok" : ""}>
                    {r.test(password) ? "✓" : "○"} {r.label}
                  </li>
                ))}
              </ul>

              <label>Confirm new password</label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
              />
              {confirm && !match && <p className="rc-error">Passwords do not match</p>}

              <label className="rc-show">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                Show passwords
              </label>

              {error && <p className="rc-error">{error}</p>}

              <button className="rc-btn" disabled={loading || !rulesOk || !match}>
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <Link to="/auth" className="rc-link">← Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
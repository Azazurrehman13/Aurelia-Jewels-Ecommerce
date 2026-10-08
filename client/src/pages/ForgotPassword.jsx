import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import logo from "../assets/Goldlogo.png";
import "./Recover.css";

const emailRegex =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0); // seconds until "Resend" works

  // countdown for the resend button
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e) => {
    e?.preventDefault();
    setError("");

    if (!emailRegex.test(email.trim())) {
      setError("Enter a valid email address, e.g. name@gmail.com");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      setWait(60);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rc-wrap">
      <div className="rc-card">
        <span className="rc-badge">
          <img src={logo} alt="Aurelia Jewels logo" />
        </span>

        {!sent ? (
          <>
            <h1>Forgot your password?</h1>
            <p>Enter the email you registered with and we will send you a link to choose a new password.</p>

            <form onSubmit={send} noValidate>
              <label>Registered email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                autoFocus
              />

              {error && <p className="rc-error">{error}</p>}

              <button className="rc-btn" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <Link to="/auth" className="rc-link">← Back to login</Link>
          </>
        ) : (
          <>
            <div className="rc-icon">✓</div>
            <h1>Check your email</h1>
            <p>
              If an account exists for <span className="rc-mail">{email.trim()}</span>, we have sent a
              link to reset your password. It works for 30 minutes.
            </p>
            <p className="rc-tip">Cannot see it? Check your Spam or Promotions folder.</p>

            <button className="rc-btn ghost" onClick={send} disabled={wait > 0 || loading}>
              {wait > 0 ? `Resend email in ${wait}s` : loading ? "Sending..." : "Resend email"}
            </button>
            {error && <p className="rc-error">{error}</p>}

            <Link to="/auth" className="rc-link">← Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
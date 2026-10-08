import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const emailRegex =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One capital letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function AuthPage() {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cordRef = useRef(null);
  const location = useLocation();
  const { user, login } = useAuth();

  // where to go after login (the page they tried to open, or home)
  const redirectTo = location.state?.from?.pathname || "/";

  const emailOk = emailRegex.test(form.email.trim());
  const passwordOk = passwordRules.every((r) => r.test(form.password));
  const blockSubmit =
    loading || !emailOk || (mode === "signup" && !passwordOk);

  // animate background and glow when the lamp toggles
  useEffect(() => {
    gsap.to("body", {
      backgroundColor: isOn ? "#1c1f24" : "#121417",
      duration: 0.6,
    });
    gsap.to(".lamp-glow", { opacity: isOn ? 1 : 0, duration: 0.6 });
  }, [isOn]);

  const pullCord = () => {
    gsap.fromTo(
      cordRef.current,
      { y: 0 },
      { y: 18, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" }
    );
    setIsOn((v) => !v);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && !form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!emailOk) {
      setError("Enter a valid email address (example: name@gmail.com)");
      return;
    }
    if (!form.password) {
      setError("Please enter your password");
      return;
    }
    if (mode === "signup" && !passwordOk) {
      setError("Password does not meet all the requirements");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "login" ? "/auth/login" : "/auth/signup";
      const { data } = await api.post(url, {
        ...form,
        email: form.email.trim(),
      });
      login(data); // saves token + user, then the redirect below kicks in
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setLoading(false);
    }
  };

  // already logged in -> leave this page
  if (user) return <Navigate to={redirectTo} replace />;

  return (
    <div className="auth-page">
      <div className="lamp-glow" />

      {/* Lamp */}
      <div className="lamp">
        <div className="lamp-shade" />
        <div className="lamp-light" style={{ opacity: isOn ? 1 : 0.15 }} />
        <div className="lamp-pole" />
        <div className="lamp-base" />
        <div className="cord" ref={cordRef} onClick={pullCord} title="Pull me">
          <span className="cord-line" />
          <span className="cord-bead" />
        </div>
      </div>

      {/* Form card */}
      <form
        className={`auth-card ${isOn ? "active" : ""}`}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>

        {mode === "signup" && (
          <>
            <label>Full name</label>
            <input
              name="name"
              placeholder="Enter name"
              value={form.name}
              onChange={handleChange}
            />
          </>
        )}

        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleChange}
        />
        {form.email && !emailOk && (
          <p className="field-error">Enter a valid email, e.g. name@gmail.com</p>
        )}

        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        {/* forgot password link (login only) */}
        {mode === "login" && (
          <Link to="/forgot-password" className="forgot">
            Forgot password?
          </Link>
        )}

        {mode === "signup" && (
          <ul className="rules">
            {passwordRules.map((r) => (
              <li key={r.label} className={r.test(form.password) ? "ok" : ""}>
                {r.test(form.password) ? "✓" : "○"} {r.label}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={blockSubmit}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
        </button>

        <p className="switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <span
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Sign up" : "Login"}
          </span>
        </p>
      </form>

      {!isOn && <p className="hint">Pull the cord to turn on the light</p>}
    </div>
  );
}
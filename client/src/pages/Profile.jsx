import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { formatPrice, formatDate, orderNo, capitalize } from "../utils/format";
import "./Profile.css";

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One capital letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]); // customer: their own orders
  const [stats, setStats] = useState(null); // admin: store-wide numbers + latest orders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // edit name
  const [name, setName] = useState(user?.name || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });

  // change password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const second = isAdmin ? api.get("/admin/stats") : api.get("/orders/mine");
    Promise.all([api.get("/auth/me"), second])
      .then(([m, o]) => {
        setMe(m.data);
        if (isAdmin) setStats(o.data);
        else setOrders(o.data);
      })
      .catch(() => setError("Could not load your account details."))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const pwRulesOk = passwordRules.every((r) => r.test(pw.next));
  const pwMatch = pw.next !== "" && pw.next === pw.confirm;
  const canChangePw = pw.current && pwRulesOk && pwMatch && !pwBusy;

  /* ---------- actions ---------- */
  const saveName = async (e) => {
    e.preventDefault();
    setNameMsg({ type: "", text: "" });

    if (!name.trim()) {
      setNameMsg({ type: "error", text: "Name cannot be empty" });
      return;
    }
    setNameBusy(true);
    try {
      const { data } = await api.put("/auth/profile", { name });
      updateUser({ name: data.name }); // the navbar greeting updates too
      setMe((m) => ({ ...m, name: data.name }));
      setName(data.name);
      setNameMsg({ type: "ok", text: "Name updated" });
    } catch (err) {
      setNameMsg({ type: "error", text: err.response?.data?.message || "Could not update your name" });
    } finally {
      setNameBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    setPwBusy(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({ type: "ok", text: "Password changed successfully" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.message || "Could not change your password" });
    } finally {
      setPwBusy(false);
    }
  };

  if (loading) return <div className="pf"><p className="pf-msg">Loading...</p></div>;
  if (error) return <div className="pf"><p className="pf-msg error">{error}</p></div>;

  /* ---------- numbers shown on this page ---------- */
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statCards = isAdmin
    ? [
        [stats.orders, "Total orders"],
        [stats.pending, "Pending orders"],
        [formatPrice(stats.sales), "Total sales"],
      ]
    : [
        [orders.length, "Total orders"],
        [orders.filter((o) => o.status === "pending").length, "Pending"],
        [formatPrice(totalSpent), "Total spent"],
      ];

  const recent = isAdmin ? stats.recent : orders.slice(0, 5);

  const info = [
    ["Full name", me.name],
    ["Email", me.email],
    ["Account type", capitalize(me.role)],
    ["Member since", formatDate(me.createdAt)],
  ];

  return (
    <div className="pf">
      {/* header */}
      <div className="pf-head">
        <div className="pf-avatar">{me.name.charAt(0).toUpperCase()}</div>
        <div>
          <h1>My Account</h1>
          <p>{isAdmin ? "Store administrator" : "Manage your details, orders and security"}</p>
        </div>
      </div>

      {/* admin shortcuts */}
      {isAdmin && (
        <div className="pf-quick">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/products/new">+ Add product</Link>
          <Link to="/admin/stock">Manage stock</Link>
          <Link to="/admin/orders">All orders</Link>
        </div>
      )}

      {/* stats */}
      <div className="pf-stats">
        {statCards.map(([value, label]) => (
          <div key={label}><b>{value}</b><span>{label}</span></div>
        ))}
      </div>

      {/* account information */}
      <section className="pf-card">
        <h2>Account information</h2>
        <ul className="pf-list">
          {info.map(([label, value]) => (
            <li key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* recent orders (admin: from all customers) */}
      <section className="pf-card">
        <div className="pf-card-head">
          <h2>{isAdmin ? "Recent customer orders" : "Recent orders"}</h2>
          {recent.length > 0 && (
            <Link to={isAdmin ? "/admin/orders" : "/orders"}>View all →</Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="pf-empty">
            {isAdmin ? (
              <p>No customer orders yet.</p>
            ) : (
              <>
                <p>You have not placed any orders yet.</p>
                <Link to="/shop" className="pf-btn small">Start shopping</Link>
              </>
            )}
          </div>
        ) : (
          <div className="pf-orders">
            {recent.map((o) => (
              <div key={o._id} className="pf-order">
                <div className="pf-order-top">
                  <div>
                    <strong>{orderNo(o._id)}</strong>
                    <span>
                      {formatDate(o.createdAt)}
                      {isAdmin && ` · ${o.user?.name || "Deleted user"}`}
                    </span>
                  </div>
                  <span className={`pf-status ${o.status}`}>{capitalize(o.status)}</span>
                </div>

                <ul className="pf-order-items">
                  {o.items.map((i) => (
                    <li key={i.product}>
                      <span>{i.name} × {i.qty}</span>
                      <span>{formatPrice(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="pf-order-foot">
                  <span>Delivering to {o.shippingAddress.city}</span>
                  <strong>Total: {formatPrice(o.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* settings */}
      <section className="pf-card">
        <h2>Settings</h2>

        {/* edit name */}
        <form className="pf-form" onSubmit={saveName} noValidate>
          <h3>Edit name</h3>
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          {nameMsg.text && <p className={`pf-note ${nameMsg.type}`}>{nameMsg.text}</p>}
          <button className="pf-btn" disabled={nameBusy || name.trim() === me.name}>
            {nameBusy ? "Saving..." : "Save name"}
          </button>
        </form>

        <hr className="pf-line" />

        {/* change password */}
        <form className="pf-form" onSubmit={changePassword} noValidate>
          <h3>Change password</h3>

          <label>Current password</label>
          <input
            type={showPw ? "text" : "password"}
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            placeholder="Enter current password"
          />

          <label>New password</label>
          <input
            type={showPw ? "text" : "password"}
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            placeholder="Enter new password"
          />

          <ul className="pf-checklist">
            {passwordRules.map((r) => (
              <li key={r.label} className={r.test(pw.next) ? "ok" : ""}>
                {r.test(pw.next) ? "✓" : "○"} {r.label}
              </li>
            ))}
          </ul>

          <label>Confirm new password</label>
          <input
            type={showPw ? "text" : "password"}
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            placeholder="Re-enter new password"
          />
          {pw.confirm && !pwMatch && <p className="pf-note error">Passwords do not match</p>}

          <label className="pf-check">
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
            Show passwords
          </label>

          {pwMsg.text && <p className={`pf-note ${pwMsg.type}`}>{pwMsg.text}</p>}
          <button className="pf-btn" disabled={!canChangePw}>
            {pwBusy ? "Updating..." : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
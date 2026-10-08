import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/Goldlogo.png";
import "./admin.css";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/stock", label: "Stock" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="ad-shell">
      {/* mobile top bar */}
      <header className="ad-top">
        <Link to="/admin" className="ad-brand">
          <span className="ad-badge">
            <img src={logo} alt="Aurelia Jewels logo" />
          </span>
          Aurelia Admin
        </Link>
        <button className="ad-burger" onClick={() => setOpen(!open)}>☰</button>
      </header>

      <aside className={`ad-side ${open ? "open" : ""}`}>
        {/* logo on the left */}
        <Link to="/admin" className="ad-logo" onClick={() => setOpen(false)}>
          <span className="ad-badge">
            <img src={logo} alt="Aurelia Jewels logo" />
          </span>
          <span className="ad-logo-text">
            Aurelia <small>Admin panel</small>
          </span>
        </Link>

        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ad-side-foot">
          <p>{user.name}</p>
          <Link to="/">View store ↗</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="ad-main">
        <Outlet />
      </main>
    </div>
  );
}
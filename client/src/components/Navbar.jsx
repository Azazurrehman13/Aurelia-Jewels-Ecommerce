import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/Goldlogo.png";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        {/* left corner: logo + name */}
        <Link to="/" className="nav-logo" onClick={close}>
          <span className="nav-badge">
            <img src={logo} alt="Aurelia Jewels logo" />
          </span>
          <span className="nav-brand">
            Aurelia <small>Jewels</small>
          </span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          ☰
        </button>

        {/* right side: links */}
        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/shop" onClick={close}>Shop</NavLink>

          {/* the admin has Stock instead of a cart */}
          {isAdmin ? (
            <NavLink to="/admin/stock" onClick={close}>Stock</NavLink>
          ) : (
            <NavLink to="/cart" onClick={close}>Cart ({count})</NavLink>
          )}

          {user ? (
            <>
              {isAdmin ? (
                <NavLink to="/admin" end onClick={close}>Admin Panel</NavLink>
              ) : (
                <NavLink to="/orders" onClick={close}>My Orders</NavLink>
              )}
              <NavLink to="/profile" onClick={close}>
                Hi, {user.name.split(" ")[0]}
              </NavLink>
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="nav-btn" onClick={close}>
              Login / Sign up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
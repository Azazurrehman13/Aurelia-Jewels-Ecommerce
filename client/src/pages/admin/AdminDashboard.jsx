import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { formatPrice, formatDate, orderNo, capitalize } from "../../utils/format";

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setS(res.data))
      .catch(() => setError("Could not load the dashboard"));
  }, []);

  if (error) return <p className="ad-error">{error}</p>;
  if (!s) return <p className="ad-muted">Loading...</p>;

  return (
    <>
      <h1 className="ad-title">Dashboard</h1>

      <div className="ad-stats">
        <div><b>{formatPrice(s.sales)}</b><span>Total sales (excluding cancelled)</span></div>
        <div><b>{s.orders}</b><span>Orders ({s.pending} pending)</span></div>
        <div><b>{s.products}</b><span>Products</span></div>
        <div><b>{s.customers}</b><span>Customers</span></div>
      </div>

      <div className="ad-two">
        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders">View all →</Link>
          </div>
          {s.recent.length === 0 ? (
            <p className="ad-muted">No orders yet.</p>
          ) : (
            <table className="ad-table">
              <tbody>
                {s.recent.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{orderNo(o._id)}</strong><br /><small>{formatDate(o.createdAt)}</small></td>
                    <td>{o.user?.name || "Deleted user"}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td><span className={`ad-status ${o.status}`}>{capitalize(o.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Low stock</h2>
            <Link to="/admin/products">Manage →</Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="ad-muted">All products are well stocked.</p>
          ) : (
            <ul className="ad-low">
              {s.lowStock.map((p) => (
                <li key={p._id}>
                  <Link to={`/admin/products/${p._id}/edit`}>{p.name}</Link>
                  <span className={p.stock === 0 ? "out" : ""}>
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
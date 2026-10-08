import { useEffect, useState } from "react";
import api from "../../api";
import { formatPrice, formatDate } from "../../utils/format";

export default function AdminCustomers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/customers")
      .then((res) => setList(res.data))
      .catch(() => setError("Could not load customers"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="ad-title">Customers <small>({list.length})</small></h1>
      {error && <p className="ad-error">{error}</p>}

      <section className="ad-card flush">
        {loading ? (
          <p className="ad-muted pad">Loading...</p>
        ) : list.length === 0 ? (
          <p className="ad-muted pad">No customers yet.</p>
        ) : (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Spent</th></tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.orders}</td>
                    <td>{formatPrice(u.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
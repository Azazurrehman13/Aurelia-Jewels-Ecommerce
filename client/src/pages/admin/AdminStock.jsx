import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useDialog } from "../../context/DialogContext";
import { formatPrice, formatDate, capitalize } from "../../utils/format";

const LOW = 3; // 1 to 3 units counts as "low stock"
const kind = (n) => (n === 0 ? "out" : n <= LOW ? "low" : "in");
const label = { in: "In stock", low: "Low stock", out: "Sold out" };

export default function AdminStock() {
  const { toast } = useDialog();
  const [products, setProducts] = useState([]);
  const [edits, setEdits] = useState({}); // product id -> typed quantity
  const [savingId, setSavingId] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/inventory")
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load the stock list"))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- totals ---------- */
  const units = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  const lowCount = products.filter((p) => kind(p.stock) === "low").length;
  const outCount = products.filter((p) => kind(p.stock) === "out").length;

  const shown = products.filter(
    (p) =>
      (filter === "all" || kind(p.stock) === filter) &&
      p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  /* ---------- quantity editing ---------- */
  const current = (p) => edits[p._id] ?? String(p.stock);
  const changed = (p) => edits[p._id] !== undefined && edits[p._id] !== String(p.stock);
  const setQty = (p, v) => setEdits((e) => ({ ...e, [p._id]: v }));
  const step = (p, d) => setQty(p, String(Math.max(0, (Number(current(p)) || 0) + d)));

  const save = async (p) => {
    const raw = String(edits[p._id]).trim();
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0) {
      toast.error("Enter a whole number, 0 or more");
      return;
    }
    setSavingId(p._id);
    try {
      const { data } = await api.put(`/admin/inventory/${p._id}`, { stock: value });
      setProducts((list) => list.map((x) => (x._id === data._id ? data : x)));
      setEdits((e) => {
        const next = { ...e };
        delete next[p._id];
        return next;
      });
      toast.success(`Stock of "${p.name}" updated to ${data.stock}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the stock");
    } finally {
      setSavingId("");
    }
  };

  const tabs = [
    ["all", `All (${products.length})`],
    ["in", "In stock"],
    ["low", `Low (${lowCount})`],
    ["out", `Sold out (${outCount})`],
  ];

  return (
    <>
      <div className="ad-head">
        <h1 className="ad-title">Stock</h1>
        <Link to="/admin/products/new" className="ad-btn">+ Add product</Link>
      </div>

      <div className="ad-stats">
        <div><b>{products.length}</b><span>Products</span></div>
        <div><b>{units}</b><span>Total items in stock</span></div>
        <div><b>{formatPrice(value)}</b><span>Stock value (price × quantity)</span></div>
        <div><b>{lowCount + outCount}</b><span>Need restocking ({lowCount} low, {outCount} sold out)</span></div>
      </div>

      <div className="ad-chips">
        {tabs.map(([key, text]) => (
          <button key={key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>
            {text}
          </button>
        ))}
      </div>

      <div className="ad-toolbar">
        <input placeholder="Search by product name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="ad-error">{error}</p>}

      <section className="ad-card flush">
        {loading ? (
          <p className="ad-muted pad">Loading...</p>
        ) : shown.length === 0 ? (
          <p className="ad-muted pad">No products match.</p>
        ) : (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th></th><th>Product</th><th>Price</th><th>Items in stock</th>
                  <th>Stock value</th><th>Status</th><th>Updated</th><th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p._id}>
                    <td className="thumb">
                      {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <span>◆</span>}
                    </td>
                    <td>
                      <strong>{p.name}</strong><br />
                      <small>
                        {capitalize(p.category)} · {capitalize(p.material)}
                        {p.purity ? ` · ${p.purity}` : ""}
                      </small>
                    </td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <div className="st-qty-row">
                        <div className="st-qty">
                          <button type="button" onClick={() => step(p, -1)}>−</button>
                          <input
                            type="number"
                            min="0"
                            value={current(p)}
                            onChange={(e) => setQty(p, e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && changed(p) && save(p)}
                          />
                          <button type="button" onClick={() => step(p, 1)}>+</button>
                        </div>
                        {changed(p) && (
                          <button className="st-save" onClick={() => save(p)} disabled={savingId === p._id}>
                            {savingId === p._id ? "Saving..." : "Save"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{formatPrice(p.stock * p.price)}</td>
                    <td><span className={`ad-status ${kind(p.stock)}`}>{label[kind(p.stock)]}</span></td>
                    <td><small>{formatDate(p.updatedAt)}</small></td>
                    <td className="actions">
                      <Link to={`/admin/products/${p._id}/edit`} className="ad-link">Edit</Link>
                    </td>
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
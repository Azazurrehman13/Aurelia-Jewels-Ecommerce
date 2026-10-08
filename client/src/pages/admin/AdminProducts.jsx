import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useDialog } from "../../context/DialogContext";
import { formatPrice, capitalize } from "../../utils/format";

const categories = ["rings", "necklaces", "earrings", "bracelets", "bangles", "sets"];

export default function AdminProducts() {
  const { confirm, toast } = useDialog();
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // wait until the admin stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/products", {
        params: { search: query || undefined, category: category || undefined, page, limit: 10 },
      })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load products"))
      .finally(() => setLoading(false));
  }, [query, category, page, reload]);

  const remove = async (p) => {
    const ok = await confirm({
      title: "Delete product?",
      message: `"${p.name}" will be removed from your store. This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/products/${p._id}`);
      toast.success(`"${p.name}" was deleted`);
      if (data.products.length === 1 && page > 1) setPage(page - 1);
      else setReload((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the product");
    }
  };

  return (
    <>
      <div className="ad-head">
        <h1 className="ad-title">Products <small>({data.total})</small></h1>
        <Link to="/admin/products/new" className="ad-btn">+ Add product</Link>
      </div>

      <div className="ad-toolbar">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{capitalize(c)}</option>
          ))}
        </select>
      </div>

      {error && <p className="ad-error">{error}</p>}

      <section className="ad-card flush">
        {loading ? (
          <p className="ad-muted pad">Loading...</p>
        ) : data.products.length === 0 ? (
          <p className="ad-muted pad">No products found.</p>
        ) : (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id}>
                    <td className="thumb">
                      {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <span>◆</span>}
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      {p.featured && <em className="ad-tag">Featured</em>}
                      <br />
                      <small>{capitalize(p.material)}{p.purity ? ` · ${p.purity}` : ""}</small>
                    </td>
                    <td>{capitalize(p.category)}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td className={p.stock === 0 ? "ad-out" : p.stock <= 3 ? "ad-low-num" : ""}>
                      {p.stock === 0 ? "Sold out" : p.stock}
                    </td>
                    <td className="actions">
                      <Link to={`/admin/products/${p._id}/edit`} className="ad-link">Edit</Link>
                      <button className="ad-link danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.pages > 1 && (
        <div className="ad-pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span>Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
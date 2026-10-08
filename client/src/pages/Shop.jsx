import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import ProductCard from "../components/ProductCard";
import { capitalize } from "../utils/format";
import "./Shop.css";

const categories = ["rings", "necklaces", "earrings", "bracelets", "bangles", "sets"];

export default function Shop() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { confirm, toast } = useDialog();
  const [params, setParams] = useSearchParams();

  // everything the user picks lives in the URL, so links like /shop?category=rings work
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page")) || 1;

  const [searchText, setSearchText] = useState(search);
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // change one or more filters; going back to page 1 unless the page itself changes
  const update = (changes) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      if (!("page" in changes)) next.delete("page");
      return next;
    });
  };

  // wait until the user stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchText !== search) update({ search: searchText });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // load products whenever a filter changes
  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/products", {
        params: {
          category: category || undefined,
          search: search || undefined,
          sort,
          page,
          limit: 9,
        },
      })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load products. Make sure the server is running."))
      .finally(() => setLoading(false));
  }, [category, search, sort, page, reload]);

  // admin: delete a product straight from the listing
  const removeProduct = async (p) => {
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
      if (data.products.length === 1 && page > 1) update({ page: page - 1 });
      else setReload((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the product");
    }
  };

  const title = category ? capitalize(category) : "All jewellery";

  return (
    <div className="shop">
      <div className="shop-head">
        <div>
          <h1>{title}</h1>
          <p>{loading ? "Loading..." : `${data.total} piece${data.total === 1 ? "" : "s"}`}</p>
        </div>

        {isAdmin && (
          <div className="shop-admin">
            <Link to="/admin/products/new" className="sa-gold">+ Add product</Link>
            <Link to="/admin/stock" className="sa-ghost">Manage stock</Link>
          </div>
        )}
      </div>

      {/* category chips */}
      <div className="chips">
        <button className={!category ? "chip on" : "chip"} onClick={() => update({ category: "" })}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "chip on" : "chip"}
            onClick={() => update({ category: c })}
          >
            {capitalize(c)}
          </button>
        ))}
      </div>

      {/* search + sort */}
      <div className="toolbar">
        <input
          className="search"
          placeholder="Search jewellery..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {error && <p className="shop-msg error">{error}</p>}

      {!error && !loading && data.products.length === 0 && (
        <p className="shop-msg">No products found. Try a different search or category.</p>
      )}

      <div className="p-grid">
        {data.products.map((p) => (
          <ProductCard key={p._id} product={p} admin={isAdmin} onDelete={removeProduct} />
        ))}
      </div>

      {/* pagination */}
      {data.pages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
            ← Previous
          </button>
          <span>
            Page {page} of {data.pages}
          </span>
          <button disabled={page >= data.pages} onClick={() => update({ page: page + 1 })}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
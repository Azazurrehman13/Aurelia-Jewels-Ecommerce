import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useDialog } from "../context/DialogContext";
import { formatPrice, capitalize } from "../utils/format";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { confirm, toast } = useDialog();
  const { items, addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setActiveImg(0);
    setQty(1);
    setAdded(false);
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) =>
        setError(
          err.response?.status === 404 || err.response?.status === 400
            ? "This product was not found."
            : "Could not load the product. Make sure the server is running."
        )
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pd"><p className="pd-msg">Loading...</p></div>;

  if (error)
    return (
      <div className="pd">
        <p className="pd-msg error">{error}</p>
        <Link to="/shop" className="pd-back">← Back to shop</Link>
      </div>
    );

  const p = product;
  const inStock = p.stock > 0;
  const inCart = items.find((i) => i._id === p._id)?.qty || 0;
  const canAddMore = inCart < p.stock;

  const handleAdd = () => {
    addToCart(p, qty);
    setAdded(true);
    setQty(1);
  };

  const handleDelete = async () => {
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
      navigate("/shop");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the product");
    }
  };

  return (
    <div className="pd">
      <Link to={`/shop?category=${p.category}`} className="pd-back">
        ← Back to {capitalize(p.category)}
      </Link>

      <div className="pd-grid">
        {/* images */}
        <div>
          <div className="pd-main">
            {p.images?.[activeImg] ? (
              <img src={p.images[activeImg]} alt={p.name} />
            ) : (
              <span className="pd-noimg">◆</span>
            )}
          </div>
          {p.images?.length > 1 && (
            <div className="pd-thumbs">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  className={i === activeImg ? "on" : ""}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="pd-info">
          <p className="pd-cat">{capitalize(p.category)}</p>
          <h1>{p.name}</h1>
          <p className="pd-price">{formatPrice(p.price)}</p>

          <p className={inStock ? "pd-stock in" : "pd-stock out"}>
            {isAdmin
              ? `${p.stock} unit${p.stock === 1 ? "" : "s"} in stock`
              : inStock
              ? p.stock <= 3 ? `Only ${p.stock} left in stock` : "In stock"
              : "Sold out"}
          </p>

          {p.description && <p className="pd-desc">{p.description}</p>}

          <table className="pd-specs">
            <tbody>
              <tr><td>Material</td><td>{capitalize(p.material)}</td></tr>
              {p.purity && <tr><td>Purity</td><td>{p.purity}</td></tr>}
              {p.weightGrams > 0 && <tr><td>Weight</td><td>{p.weightGrams} g</td></tr>}
              <tr><td>Category</td><td>{capitalize(p.category)}</td></tr>
            </tbody>
          </table>

          {/* ---------- admin: manage this product ---------- */}
          {isAdmin ? (
            <div className="pd-buy">
              <Link to={`/admin/products/${p._id}/edit`} className="pd-add pd-edit">
                Edit product
              </Link>
              <button className="pd-del" onClick={handleDelete}>Delete product</button>
            </div>
          ) : (
            <>
              {inStock && canAddMore && (
                <div className="pd-buy">
                  <div className="pd-qty">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(p.stock - inCart, q + 1))}>+</button>
                  </div>
                  <button className="pd-add" onClick={handleAdd}>Add to cart</button>
                </div>
              )}

              {inStock && !canAddMore && (
                <p className="pd-note">You have all available stock of this item in your cart.</p>
              )}

              {added && (
                <p className="pd-note">
                  ✓ Added to cart. <Link to="/cart" style={{ color: "#f5e08a" }}>View cart →</Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
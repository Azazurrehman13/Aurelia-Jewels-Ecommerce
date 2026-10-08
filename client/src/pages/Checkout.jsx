import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice, deliveryFor, FREE_DELIVERY_OVER } from "../utils/format";
import "./Checkout.css";

const phoneRegex = /^(\+92|0)3\d{9}$/;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const placed = useRef(false);

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: "",
    city: "",
    address: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const delivery = deliveryFor(total);

  // nothing to check out (but don't bounce away right after placing an order)
  if (items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.city.trim() || !form.address.trim()) {
      setError("Please fill in your name, city and address");
      return;
    }
    if (!phoneRegex.test(form.phone.replace(/[\s-]/g, ""))) {
      setError("Enter a valid mobile number, e.g. 03001234567");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((i) => ({ productId: i._id, qty: i.qty })),
        shippingAddress: form,
        paymentMethod: "cod",
      });
      placed.current = true;
      clearCart();
      navigate(`/order-success/${data._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not place the order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="co">
      <h1>Checkout</h1>

      <form className="co-layout" onSubmit={handleSubmit} noValidate>
        {/* left: details */}
        <div className="co-card">
          <h2>Delivery details</h2>

          <label>Full name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />

          <div className="co-two">
            <div>
              <label>Mobile number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="03001234567" />
            </div>
            <div>
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Lahore" />
            </div>
          </div>

          <label>Full address</label>
          <textarea name="address" rows="3" value={form.address} onChange={handleChange}
            placeholder="House, street, area" />

          <label>Note for the seller (optional)</label>
          <input name="note" value={form.note} onChange={handleChange} placeholder="Any special instructions" />

          <h2 className="co-pay-title">Payment</h2>
          <div className="co-pay">
            <input type="radio" checked readOnly />
            <div>
              <strong>Cash on Delivery</strong>
              <p>Pay in cash when your order arrives.</p>
            </div>
          </div>
          <p className="co-soon">Card, JazzCash and Easypaisa coming soon.</p>
        </div>

        {/* right: summary */}
        <aside className="co-summary">
          <h2>Order summary</h2>

          <div className="co-items">
            {items.map((i) => (
              <div key={i._id} className="co-item">
                <div className="co-thumb">
                  {i.image ? <img src={i.image} alt={i.name} /> : <span>◆</span>}
                  <b>{i.qty}</b>
                </div>
                <p>{i.name}</p>
                <span>{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="sum-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
          <div className="sum-row">
            <span>Delivery</span>
            <span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span>
          </div>
          {delivery > 0 && (
            <p className="co-hint">Free delivery on orders over {formatPrice(FREE_DELIVERY_OVER)}</p>
          )}
          <div className="sum-row sum-total">
            <span>Total</span>
            <span>{formatPrice(total + delivery)}</span>
          </div>

          {error && <p className="co-error">{error}</p>}

          <button type="submit" className="co-btn" disabled={loading}>
            {loading ? "Placing order..." : "Place order"}
          </button>
          <Link to="/cart" className="co-back">← Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
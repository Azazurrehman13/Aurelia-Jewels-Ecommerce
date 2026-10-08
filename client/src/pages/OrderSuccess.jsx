import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { formatPrice, orderNo } from "../utils/format";
import "./Checkout.css";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("We could not load this order."));
  }, [id]);

  if (error)
    return (
      <div className="ok">
        <p style={{ color: "#ff7b7b" }}>{error}</p>
        <Link to="/orders" className="co-back">Go to my orders</Link>
      </div>
    );

  if (!order) return <div className="ok"><p style={{ color: "#999" }}>Loading...</p></div>;

  const a = order.shippingAddress;

  return (
    <div className="ok">
      <div className="ok-tick">✓</div>
      <h1>Thank you, your order is placed!</h1>
      <p className="ok-sub">
        Order <strong style={{ color: "#f5e08a" }}>{orderNo(order._id)}</strong> has been received.
        Please keep {formatPrice(order.total)} ready in cash for delivery.
      </p>

      <div className="ok-card">
        <h3>Delivering to</h3>
        <p>{a.fullName} · {a.phone}</p>
        <p>{a.address}, {a.city}</p>
      </div>

      <div className="ok-card">
        <h3>Items</h3>
        {order.items.map((i) => (
          <p key={i.product} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{i.name} × {i.qty}</span>
            <span>{formatPrice(i.price * i.qty)}</span>
          </p>
        ))}
        <p style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <span>Delivery</span>
          <span>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
        </p>
        <p style={{ display: "flex", justifyContent: "space-between", color: "#f5e08a", fontWeight: 600, fontSize: 16 }}>
          <span>Total (Cash on Delivery)</span>
          <span>{formatPrice(order.total)}</span>
        </p>
      </div>

      <div className="ok-actions">
        <Link to="/orders" className="co-btn">View my orders</Link>
        <Link to="/shop" className="co-btn outline">Continue shopping</Link>
      </div>
    </div>
  );
}
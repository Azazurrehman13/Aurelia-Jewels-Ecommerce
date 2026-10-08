import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useDialog } from "../context/DialogContext";
import { formatPrice, formatDate, orderNo, capitalize } from "../utils/format";
import "./Orders.css";

export default function MyOrders() {
  const { confirm, toast } = useDialog();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/mine")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Could not load your orders."))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id) => {
    const ok = await confirm({
      title: "Cancel this order?",
      message: `Order ${orderNo(id)} will be cancelled. You can place a new order any time.`,
      confirmText: "Yes, cancel it",
      cancelText: "Keep order",
      danger: true,
    });
    if (!ok) return;

    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => (o._id === id ? data : o)));
      toast.success("Your order was cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel the order");
    }
  };

  if (loading) return <div className="ord"><p className="ord-msg">Loading...</p></div>;

  return (
    <div className="ord">
      <h1>My orders</h1>
      {error && <p className="ord-msg error">{error}</p>}

      {!error && orders.length === 0 && (
        <div className="ord-empty">
          <p>You have not placed any orders yet.</p>
          <Link to="/shop" className="ord-btn">Start shopping</Link>
        </div>
      )}

      {orders.map((o) => (
        <div key={o._id} className="ord-card">
          <div className="ord-top">
            <div>
              <strong>{orderNo(o._id)}</strong>
              <span>{formatDate(o.createdAt)}</span>
            </div>
            <span className={`ord-status ${o.status}`}>{capitalize(o.status)}</span>
          </div>

          <div className="ord-items">
            {o.items.map((i) => (
              <Link key={i.product} to={`/product/${i.product}`} className="ord-item">
                <div className="ord-thumb">
                  {i.image ? <img src={i.image} alt={i.name} /> : <span>◆</span>}
                </div>
                <p>{i.name}<small>Qty {i.qty}</small></p>
                <span>{formatPrice(i.price * i.qty)}</span>
              </Link>
            ))}
          </div>

          <div className="ord-bottom">
            <p>Total: <strong>{formatPrice(o.total)}</strong> · Cash on Delivery</p>
            {o.status === "pending" && (
              <button onClick={() => cancel(o._id)}>Cancel order</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
import { useEffect, useState } from "react";
import api from "../../api";
import { useDialog } from "../../context/DialogContext";
import { formatPrice, formatDate, orderNo, capitalize } from "../../utils/format";

const tabs = ["", "pending", "shipped", "delivered", "cancelled"];

// the next steps the admin can take for each status
const actions = {
  pending: [["shipped", "Mark as shipped"], ["cancelled", "Cancel order"]],
  shipped: [["delivered", "Mark as delivered"], ["cancelled", "Cancel order"]],
  delivered: [],
  cancelled: [],
};

export default function AdminOrders() {
  const { confirm, toast } = useDialog();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/admin/orders", { params: { status: status || undefined, page, limit: 10 } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load orders"))
      .finally(() => setLoading(false));
  }, [status, page]);

  const change = async (order, next) => {
    if (next === "cancelled") {
      const ok = await confirm({
        title: "Cancel this order?",
        message: `Order ${orderNo(order._id)} will be cancelled and its items returned to stock.`,
        confirmText: "Cancel order",
        cancelText: "Keep order",
        danger: true,
      });
      if (!ok) return;
    }

    try {
      const { data: updated } = await api.put(`/admin/orders/${order._id}/status`, { status: next });
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) => (o._id === updated._id ? updated : o)),
      }));
      toast.success(
        next === "cancelled" ? "Order cancelled and stock restored" : `Order marked as ${next}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the order");
    }
  };

  return (
    <>
      <h1 className="ad-title">Orders <small>({data.total})</small></h1>

      <div className="ad-chips">
        {tabs.map((t) => (
          <button key={t || "all"} className={status === t ? "on" : ""}
            onClick={() => { setStatus(t); setPage(1); }}>
            {t ? capitalize(t) : "All"}
          </button>
        ))}
      </div>

      {error && <p className="ad-error">{error}</p>}
      {loading && <p className="ad-muted">Loading...</p>}
      {!loading && data.orders.length === 0 && <p className="ad-muted">No orders found.</p>}

      {data.orders.map((o) => (
        <section key={o._id} className="ad-card ad-order">
          <div className="ad-order-top">
            <div>
              <strong>{orderNo(o._id)}</strong>
              <small>{formatDate(o.createdAt)}</small>
            </div>
            <span className={`ad-status ${o.status}`}>{capitalize(o.status)}</span>
          </div>

          <div className="ad-order-body">
            <div>
              <h4>Customer</h4>
              <p>{o.user?.name || "Deleted user"}</p>
              <p className="ad-muted">{o.user?.email}</p>
              <h4>Deliver to</h4>
              <p>{o.shippingAddress.fullName} · {o.shippingAddress.phone}</p>
              <p>{o.shippingAddress.address}, {o.shippingAddress.city}</p>
              {o.shippingAddress.note && <p className="ad-muted">Note: {o.shippingAddress.note}</p>}
            </div>

            <div>
              <h4>Items</h4>
              {o.items.map((i) => (
                <p key={i.product} className="ad-line">
                  <span>{i.name} × {i.qty}</span>
                  <span>{formatPrice(i.price * i.qty)}</span>
                </p>
              ))}
              <p className="ad-line"><span>Delivery</span><span>{o.deliveryFee === 0 ? "Free" : formatPrice(o.deliveryFee)}</span></p>
              <p className="ad-line total"><span>Total (Cash on Delivery)</span><span>{formatPrice(o.total)}</span></p>
            </div>
          </div>

          {actions[o.status].length > 0 && (
            <div className="ad-order-foot">
              {actions[o.status].map(([next, label]) => (
                <button key={next} className={next === "cancelled" ? "ad-btn danger" : "ad-btn"}
                  onClick={() => change(o, next)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>
      ))}

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
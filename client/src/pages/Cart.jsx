import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import logo from "../assets/Goldlogo.png";
import { formatPrice, capitalize } from "../utils/format";
import "./Cart.css";

export default function Cart() {
  const { items, count, total, updateQty, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { confirm, toast } = useDialog();
  const navigate = useNavigate();

  const checkout = () => {
    if (user) {
      navigate("/checkout");
    } else {
      // send them to login, then bring them back to checkout
      navigate("/auth", { state: { from: { pathname: "/checkout" } } });
    }
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: "Clear your cart?",
      message: `All ${count} item${count === 1 ? "" : "s"} will be removed from your cart.`,
      confirmText: "Clear cart",
      danger: true,
    });
    if (ok) {
      clearCart();
      toast.info("Your cart was cleared");
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart">
        <div className="cart-empty">
          <span className="cart-empty-logo">
            <img src={logo} alt="Aurelia Jewels logo" />
          </span>
          <h1>Your cart is empty</h1>
          <p>Looks like you haven't added any jewellery yet.</p>
          <Link to="/shop" className="cart-btn">Browse the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-head">
        <h1>Your cart</h1>
        <p>{count} item{count === 1 ? "" : "s"}</p>
      </div>

      <div className="cart-layout">
        {/* items */}
        <div className="cart-list">
          {items.map((i) => (
            <div key={i._id} className="cart-item">
              <Link to={`/product/${i._id}`} className="cart-img">
                {i.image ? <img src={i.image} alt={i.name} /> : <span>◆</span>}
              </Link>

              <div className="cart-info">
                <Link to={`/product/${i._id}`} className="cart-name">{i.name}</Link>
                <p className="cart-meta">
                  {capitalize(i.material)}
                  {i.purity ? ` · ${i.purity}` : ""}
                </p>
                <p className="cart-unit">{formatPrice(i.price)} each</p>

                <div className="cart-row">
                  <div className="cart-qty">
                    <button onClick={() => updateQty(i._id, i.qty - 1)} disabled={i.qty <= 1}>−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => updateQty(i._id, i.qty + 1)} disabled={i.qty >= i.stock}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(i._id)}>Remove</button>
                </div>
                {i.qty >= i.stock && <p className="cart-limit">Maximum available stock reached</p>}
              </div>

              <p className="cart-line">{formatPrice(i.price * i.qty)}</p>
            </div>
          ))}

          <button className="cart-clear" onClick={handleClear}>Clear cart</button>
        </div>

        {/* summary */}
        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="sum-row"><span>Subtotal ({count} items)</span><span>{formatPrice(total)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>Calculated at checkout</span></div>
          <div className="sum-row sum-total"><span>Total</span><span>{formatPrice(total)}</span></div>

          <button className="cart-btn full" onClick={checkout}>
            {user ? "Proceed to checkout" : "Login to checkout"}
          </button>
          <Link to="/shop" className="cart-continue">← Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
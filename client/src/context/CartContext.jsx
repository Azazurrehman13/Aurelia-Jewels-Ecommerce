import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const KEY = "cart";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  // save the cart every time it changes
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i._id === product._id);
      if (found) {
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, stock: product.stock, qty: Math.min(i.qty + qty, product.stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          material: product.material,
          purity: product.purity,
          stock: product.stock,
          qty: Math.min(qty, product.stock),
        },
      ];
    });
  };

  const updateQty = (id, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i
      )
    );

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i._id !== id));

  const clearCart = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, count, total, addToCart, updateQty, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
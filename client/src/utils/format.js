export const formatPrice = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");

export const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// must match the numbers in server/routes/orders.js
export const FREE_DELIVERY_OVER = 100000;
export const DELIVERY_FEE = 500;
export const deliveryFor = (subtotal) =>
  subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

export const orderNo = (id = "") => "#" + String(id).slice(-8).toUpperCase();

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
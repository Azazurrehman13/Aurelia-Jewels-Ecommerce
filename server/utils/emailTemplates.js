const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");
const orderNo = (id) => "#" + String(id).slice(-8).toUpperCase();
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const GOLD = "#8c6a35";
const PLUM = "#4a2860";

/* ---------- shared pieces ---------- */
const layout = ({ preheader, heading, intro, content, buttonText, buttonUrl }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4ecf7;font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ecf7;padding:24px 12px;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7dcee;border-radius:16px;">
    <tr><td style="padding:24px 28px;background:#e9dcef;border-radius:16px 16px 0 0;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:${PLUM};letter-spacing:.5px;">HafAura</div>
      <div style="margin-top:4px;font-size:10px;letter-spacing:6px;color:#9a7440;">JEWELRY</div>
    </td></tr>
    <tr><td style="padding:28px;color:#3a2a47;font-size:14px;line-height:1.65;">
      <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:500;color:${PLUM};">${heading}</h1>
      <p style="margin:0 0 6px;color:#6b5c7b;">${intro}</p>
      ${content}
      ${buttonUrl ? `<p style="text-align:center;margin:26px 0 4px;"><a href="${buttonUrl}" style="display:inline-block;padding:12px 30px;border-radius:999px;background:${PLUM};color:#ffffff;font-weight:600;text-decoration:none;">${buttonText}</a></p>` : ""}
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid #eee4f2;text-align:center;color:#9a8cab;font-size:11px;">
      &copy; ${new Date().getFullYear()} HafAura Jewelry. This is an automated message.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

const itemsTable = (order) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #eee4f2;">
  ${order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee4f2;color:#3a2a47;">${esc(i.name)} &times; ${i.qty}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #eee4f2;color:${GOLD};">${money(i.price * i.qty)}</td>
      </tr>`
    )
    .join("")}
  <tr>
    <td style="padding:10px 0;color:#8a7c99;">Delivery</td>
    <td align="right" style="padding:10px 0;color:#8a7c99;">${order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;color:${PLUM};font-weight:600;">Total (Cash on Delivery)</td>
    <td align="right" style="padding:10px 0;color:${PLUM};font-weight:600;">${money(order.total)}</td>
  </tr>
</table>`;

const addressBlock = (order) => {
  const a = order.shippingAddress;
  return `<p style="margin:14px 0 0;color:#9a8cab;font-size:12px;letter-spacing:1px;">DELIVERY ADDRESS</p>
  <p style="margin:4px 0 0;color:#3a2a47;">${esc(a.fullName)} &middot; ${esc(a.phone)}<br>${esc(a.address)}, ${esc(a.city)}</p>
  ${a.note ? `<p style="margin:8px 0 0;color:#8a7c99;">Note: ${esc(a.note)}</p>` : ""}`;
};

/* ---------- customer emails ---------- */
export const orderPlacedEmail = (order, user) => ({
  subject: `Order ${orderNo(order._id)} confirmed - HafAura Jewelry`,
  html: layout({
    preheader: `We received your order ${orderNo(order._id)}.`,
    heading: "Thank you for your order!",
    intro: `Hi ${esc(user.name)}, we have received your order <strong style="color:${GOLD};">${orderNo(order._id)}</strong>. Please keep ${money(order.total)} ready in cash when it arrives.`,
    content: itemsTable(order) + addressBlock(order),
    buttonText: "View my orders",
    buttonUrl: `${clientUrl()}/orders`,
  }),
});

const statusText = {
  shipped: {
    subject: "is on its way",
    heading: "Your order is on its way",
    intro: "Good news, your order has been shipped and is on its way to you.",
  },
  delivered: {
    subject: "was delivered",
    heading: "Your order was delivered",
    intro: "Your order has been delivered. We hope you love your jewellery. Thank you for shopping with us!",
  },
  cancelled: {
    subject: "was cancelled",
    heading: "Your order was cancelled",
    intro: "Your order has been cancelled. If you did not expect this, please contact us.",
  },
};

export const statusEmail = (order, user, status) => {
  const t = statusText[status];
  return {
    subject: `Order ${orderNo(order._id)} ${t.subject} - HafAura Jewelry`,
    html: layout({
      preheader: `Order ${orderNo(order._id)} ${t.subject}.`,
      heading: t.heading,
      intro: `Hi ${esc(user.name)}, ${t.intro} <br><span style="color:#9a8cab;">Order ${orderNo(order._id)}</span>`,
      content: itemsTable(order) + addressBlock(order),
      buttonText: "View my orders",
      buttonUrl: `${clientUrl()}/orders`,
    }),
  };
};

/* ---------- admin emails ---------- */
export const adminNewOrderEmail = (order, user) => ({
  subject: `New order ${orderNo(order._id)} from ${user.name} - ${money(order.total)}`,
  html: layout({
    preheader: `${user.name} placed an order for ${money(order.total)}.`,
    heading: "New order booked",
    intro: `<strong style="color:${GOLD};">${esc(user.name)}</strong> (${esc(user.email)}) placed order ${orderNo(order._id)}.`,
    content: itemsTable(order) + addressBlock(order),
    buttonText: "Open in admin panel",
    buttonUrl: `${clientUrl()}/admin/orders`,
  }),
});

export const adminCancelledEmail = (order, user) => ({
  subject: `Order ${orderNo(order._id)} was cancelled by ${user.name}`,
  html: layout({
    preheader: `${user.name} cancelled order ${orderNo(order._id)}.`,
    heading: "Order cancelled by customer",
    intro: `<strong style="color:${GOLD};">${esc(user.name)}</strong> (${esc(user.email)}) cancelled order ${orderNo(order._id)}. The items were returned to stock.`,
    content: itemsTable(order),
    buttonText: "Open in admin panel",
    buttonUrl: `${clientUrl()}/admin/orders`,
  }),
});

/* ---------- password reset ---------- */
export const passwordResetEmail = (user, link, minutes) => ({
  subject: "Reset your HafAura Jewelry password",
  html: layout({
    preheader: "Use this link to choose a new password.",
    heading: "Reset your password",
    intro: `Hi ${esc(user.name)}, we received a request to reset your password. Click the button below to choose a new one. The link works for ${minutes} minutes and can be used only once.`,
    content: `
      <p style="margin:18px 0 0;color:#8a7c99;font-size:12px;">If the button does not work, copy this link into your browser:<br>
      <span style="color:${GOLD};word-break:break-all;">${esc(link)}</span></p>
      <p style="margin:14px 0 0;color:#8a7c99;font-size:12px;">If you did not ask for this, you can ignore this email. Your password will stay the same.</p>`,
    buttonText: "Reset my password",
    buttonUrl: link,
  }),
});

export const passwordChangedEmail = (user) => ({
  subject: "Your HafAura Jewelry password was changed",
  html: layout({
    preheader: "Your password was just changed.",
    heading: "Password changed",
    intro: `Hi ${esc(user.name)}, the password for your account was just changed. You can now log in with your new password.`,
    content: `<p style="margin:16px 0 0;color:#8a7c99;font-size:12px;">If this was not you, reset your password again right away from the login page.</p>`,
    buttonText: "Log in",
    buttonUrl: `${clientUrl()}/auth`,
  }),
});
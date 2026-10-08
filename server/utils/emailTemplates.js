const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");
const orderNo = (id) => "#" + String(id).slice(-8).toUpperCase();
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

/* ---------- shared pieces ---------- */
const layout = ({ preheader, heading, intro, content, buttonText, buttonUrl }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#121417;font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#121417;padding:24px 12px;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1c1f24;border:1px solid #3a3320;border-radius:14px;">
    <tr><td style="padding:22px 28px;border-bottom:1px solid #2c2f35;text-align:center;">
      <span style="color:#d4af37;font-size:12px;letter-spacing:4px;">&#9670; AURELIA JEWELS</span>
    </td></tr>
    <tr><td style="padding:28px;color:#e6e6e6;font-size:14px;line-height:1.65;">
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:500;color:#f5e08a;">${heading}</h1>
      <p style="margin:0 0 6px;color:#bbb;">${intro}</p>
      ${content}
      ${buttonUrl ? `<p style="text-align:center;margin:26px 0 4px;"><a href="${buttonUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;background:#d4af37;color:#3a2d00;font-weight:600;text-decoration:none;">${buttonText}</a></p>` : ""}
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid #2c2f35;text-align:center;color:#777;font-size:11px;">
      &copy; ${new Date().getFullYear()} Aurelia Jewels. This is an automated message.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

const itemsTable = (order) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-top:1px solid #2c2f35;">
  ${order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #2c2f35;color:#ddd;">${esc(i.name)} &times; ${i.qty}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #2c2f35;color:#f5e08a;">${money(i.price * i.qty)}</td>
      </tr>`
    )
    .join("")}
  <tr>
    <td style="padding:10px 0;color:#999;">Delivery</td>
    <td align="right" style="padding:10px 0;color:#999;">${order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;color:#fff;font-weight:600;">Total (Cash on Delivery)</td>
    <td align="right" style="padding:10px 0;color:#f5e08a;font-weight:600;">${money(order.total)}</td>
  </tr>
</table>`;

const addressBlock = (order) => {
  const a = order.shippingAddress;
  return `<p style="margin:14px 0 0;color:#999;font-size:12px;letter-spacing:1px;">DELIVERY ADDRESS</p>
  <p style="margin:4px 0 0;color:#ddd;">${esc(a.fullName)} &middot; ${esc(a.phone)}<br>${esc(a.address)}, ${esc(a.city)}</p>
  ${a.note ? `<p style="margin:8px 0 0;color:#999;">Note: ${esc(a.note)}</p>` : ""}`;
};

/* ---------- customer emails ---------- */
export const orderPlacedEmail = (order, user) => ({
  subject: `Order ${orderNo(order._id)} confirmed - Aurelia Jewels`,
  html: layout({
    preheader: `We received your order ${orderNo(order._id)}.`,
    heading: "Thank you for your order!",
    intro: `Hi ${esc(user.name)}, we have received your order <strong style="color:#f5e08a;">${orderNo(order._id)}</strong>. Please keep ${money(order.total)} ready in cash when it arrives.`,
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
    subject: `Order ${orderNo(order._id)} ${t.subject} - Aurelia Jewels`,
    html: layout({
      preheader: `Order ${orderNo(order._id)} ${t.subject}.`,
      heading: t.heading,
      intro: `Hi ${esc(user.name)}, ${t.intro} <br><span style="color:#999;">Order ${orderNo(order._id)}</span>`,
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
    intro: `<strong style="color:#f5e08a;">${esc(user.name)}</strong> (${esc(user.email)}) placed order ${orderNo(order._id)}.`,
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
    intro: `<strong style="color:#f5e08a;">${esc(user.name)}</strong> (${esc(user.email)}) cancelled order ${orderNo(order._id)}. The items were returned to stock.`,
    content: itemsTable(order),
    buttonText: "Open in admin panel",
    buttonUrl: `${clientUrl()}/admin/orders`,
  }),
});

/* ---------- password reset ---------- */
export const passwordResetEmail = (user, link, minutes) => ({
  subject: "Reset your Aurelia Jewels password",
  html: layout({
    preheader: "Use this link to choose a new password.",
    heading: "Reset your password",
    intro: `Hi ${esc(user.name)}, we received a request to reset your password. Click the button below to choose a new one. The link works for ${minutes} minutes and can be used only once.`,
    content: `
      <p style="margin:18px 0 0;color:#999;font-size:12px;">If the button does not work, copy this link into your browser:<br>
      <span style="color:#d4af37;word-break:break-all;">${esc(link)}</span></p>
      <p style="margin:14px 0 0;color:#999;font-size:12px;">If you did not ask for this, you can ignore this email. Your password will stay the same.</p>`,
    buttonText: "Reset my password",
    buttonUrl: link,
  }),
});

export const passwordChangedEmail = (user) => ({
  subject: "Your Aurelia Jewels password was changed",
  html: layout({
    preheader: "Your password was just changed.",
    heading: "Password changed",
    intro: `Hi ${esc(user.name)}, the password for your account was just changed. You can now log in with your new password.`,
    content: `<p style="margin:16px 0 0;color:#999;font-size:12px;">If this was not you, reset your password again right away from the login page.</p>`,
    buttonText: "Log in",
    buttonUrl: `${clientUrl()}/auth`,
  }),
});
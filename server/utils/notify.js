import { sendMail } from "./mailer.js";
import {
  orderPlacedEmail,
  adminNewOrderEmail,
  statusEmail,
  adminCancelledEmail,
  passwordResetEmail,
  passwordChangedEmail,
} from "./emailTemplates.js";

// where admin alerts go
const adminTo = () =>
  process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

// a problem while building an email must never break the request
const safe = (name, fn) => (...args) => {
  try {
    fn(...args);
  } catch (err) {
    console.error(`Notification error (${name}):`, err.message);
  }
};

// customer placed an order
export const notifyOrderPlaced = safe("order placed", (order, user) => {
  sendMail({ to: user.email, ...orderPlacedEmail(order, user) });
  if (adminTo()) sendMail({ to: adminTo(), ...adminNewOrderEmail(order, user) });
});

// customer cancelled their own order
export const notifyCustomerCancelled = safe("customer cancel", (order, user) => {
  sendMail({ to: user.email, ...statusEmail(order, user, "cancelled") });
  if (adminTo()) sendMail({ to: adminTo(), ...adminCancelledEmail(order, user) });
});

// admin changed the status (shipped, delivered, cancelled)
export const notifyStatusChange = safe("status change", (order, user) => {
  if (!user?.email) return; // the customer account was deleted
  sendMail({ to: user.email, ...statusEmail(order, user, order.status) });
});

// forgot password: email the reset link
export const notifyPasswordReset = safe("password reset", (user, token, minutes) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  const link = `${base}/reset-password/${token}`;
  sendMail({ to: user.email, ...passwordResetEmail(user, link, minutes) });
});

// password was changed through a reset link
export const notifyPasswordChanged = safe("password changed", (user) => {
  sendMail({ to: user.email, ...passwordChangedEmail(user) });
});
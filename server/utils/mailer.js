import nodemailer from "nodemailer";

let transporter;

// created on first use, so .env is already loaded
const getTransporter = () => {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = (process.env.EMAIL_APP_PASSWORD || "").replace(/\s/g, "");
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
};

// never throws: a failed email must not break an order
export const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[email not set up] would send "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Aurelia Jewels"}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: "${subject}" -> ${to}`);
    return true;
  } catch (err) {
    console.error(`Email failed (${subject} -> ${to}):`, err.message);
    return false;
  }
};
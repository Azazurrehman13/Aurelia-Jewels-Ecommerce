import dotenv from "dotenv";
import { sendMail } from "./utils/mailer.js";

dotenv.config();

const to = process.argv[2] || process.env.EMAIL_USER;

const ok = await sendMail({
  to,
  subject: "Aurelia Jewels: test email",
  html: "<h2>It works!</h2><p>Your email setup is ready.</p>",
});

console.log(ok ? `Test email sent to ${to}` : "Test failed, see the message above");
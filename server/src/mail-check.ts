import "dotenv/config";
import nodemailer from "nodemailer";
import { z } from "zod";
import { smtpOptions } from "./smtp.js";
import { TRANSACTIONAL_FROM, withEmailSignature } from "./mail-policy.js";

// Explicit operator-only command: sends one diagnostic, never starts the worker
// or imports the database. It does not activate or consume the production queue.
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--to") {
  throw new Error(
    "Usage: npm run mail:check -w server -- --to operator-owned@example.com",
  );
}
const to = z.string().email().parse(args[1]);
if (process.env.MAIL_DELIVERY_ENABLED !== "false") {
  throw new Error("Keep MAIL_DELIVERY_ENABLED=false during this diagnostic.");
}
if (process.env.MAIL_FROM !== TRANSACTIONAL_FROM || !process.env.SMTP_HOST) {
  throw new Error(
    "Configure SMTP_HOST and the required no-reply MAIL_FROM first.",
  );
}
const replyTo = process.env.MAIL_REPLY_TO
  ? z.string().email().parse(process.env.MAIL_REPLY_TO)
  : undefined;
const publicUrl = new URL(z.string().url().parse(process.env.PUBLIC_URL));
if (!["http:", "https:"].includes(publicUrl.protocol))
  throw new Error("Invalid PUBLIC_URL protocol.");
const escapedUrl = publicUrl.href
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const transport = nodemailer.createTransport(smtpOptions(process.env));
try {
  await transport.verify();
  const result = await transport.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    replyTo,
    subject: "IN-D-BOX · Vérification SMTP opérateur",
    ...withEmailSignature(
      `<p>Message de contrôle SMTP IN-D-BOX destiné uniquement à l’opérateur.</p><p><a href="${escapedUrl}">${escapedUrl}</a></p>`,
      `Message de contrôle SMTP IN-D-BOX destiné uniquement à l’opérateur.\n${publicUrl.href}`,
    ),
  });
  if (!result.accepted.length || result.rejected.length)
    throw new Error("SMTP did not accept the diagnostic recipient.");
  console.log(
    "One diagnostic accepted by SMTP. Confirm inbox receipt and authentication headers manually. Application delivery remains disabled; no outbox rows were touched.",
  );
} finally {
  transport.close();
}

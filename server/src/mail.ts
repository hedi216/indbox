import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { db } from "./db.js";
import { env } from "./config.js";
const escape = (v: any) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const money = (v: any) => `${Number(v).toFixed(3)} TND`;
const labels: Record<string, string> = {
  NEW: "Commande reçue",
  CONFIRMED: "Commande confirmée",
  IN_PREPARATION: "En préparation",
  READY: "Prête",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REVIEWING: "En cours d’étude",
  CONTACTED: "Prise de contact",
  QUOTED: "Devis proposé",
  ACCEPTED: "Devis accepté",
  REJECTED: "Devis refusé",
  CLOSED: "Dossier clôturé",
};
function template(title: string, body: string, footer: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f2ed;font:15px Arial,sans-serif;color:#25241f"><table role="presentation" width="100%"><tr><td style="padding:30px"><table role="presentation" width="100%" style="max-width:640px;margin:auto;background:white"><tr><td style="padding:28px;background:#151511;color:#e6b457;font-size:24px;font-weight:bold">IN-D-BOX <span style="font-size:11px;color:white">BOXES THAT STAND OUT</span></td></tr><tr><td style="padding:30px"><h1 style="font-size:24px">${escape(title)}</h1>${body}<p style="margin-top:28px">L’équipe IN-D-BOX</p></td></tr><tr><td style="padding:20px;background:#ece8df;font-size:12px">${escape(footer)}</td></tr></table></td></tr></table></body></html>`;
}
async function enqueue(
  tx: Prisma.TransactionClient,
  to: string,
  event: string,
  reference: string,
  title: string,
  body: string,
) {
  const settings = await tx.siteSetting.findUnique({ where: { key: "site" } });
  const site = settings?.value as any;
  const html = template(
    title,
    body,
    [site?.email, site?.phone, site?.address].filter(Boolean).join(" · "),
  );
  await tx.emailNotification.upsert({
    where: { event_reference_to: { event, reference, to } },
    create: {
      to,
      event,
      reference,
      subject: `IN-D-BOX · ${title}`,
      html,
      text: html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">"),
    },
    update: {},
  });
}
export async function orderEmail(
  tx: Prisma.TransactionClient,
  order: any,
  event: string,
  reference = order.id,
) {
  const title = `${order.number} — ${labels[order.status]}`;
  const body = `<p>Bonjour ${escape(order.firstName)},</p><p>${order.status === "NEW" ? "Merci pour votre commande. Notre équipe vous contactera pour confirmer la livraison et le règlement." : `Votre commande est maintenant : <strong>${escape(labels[order.status])}</strong>.`}</p><h2 style="font-size:18px">Détail de la commande</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Article</th><th>Qté</th><th align="right">Total</th></tr></thead><tbody>${order.items
    .map(
      (i: any) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">${escape(i.productName)}<br><small>${escape(i.variantName || i.sku)} · ${i.orderUnit === "LOT" ? `${i.quantityPerLot} pièces / lot` : "à l’unité"}<br>${escape(
          Object.entries(i.characteristics || {})
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · "),
        )}<br>${money(i.unitPrice)} / ${i.orderUnit === "LOT" ? "lot" : "unité"}</small></td><td align="center">${i.quantity}</td><td align="right">${money(i.total)}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><p>Sous-total : ${money(order.subtotal)}<br>Promotions : −${money(order.promotionDiscount)}<br>Coupon ${escape(order.couponCode || "")} : −${money(order.couponDiscount)}</p><p style="font-size:22px"><strong>Total : ${money(order.total)}</strong></p><h2 style="font-size:18px">Livraison</h2><p>${escape(order.firstName)} ${escape(order.lastName)}<br>${escape(order.company)}<br>${escape(order.address)}, ${escape(order.city)}<br>${escape(order.phone)}</p>${order.notes ? `<p>Votre note : ${escape(order.notes)}</p>` : ""}<p><a href="${env.PUBLIC_URL}/account" style="color:#986416">Consulter mon compte</a></p>`;
  await enqueue(tx, order.email, event, reference, title, body);
  if (process.env.ADMIN_NOTIFICATION_EMAIL)
    await enqueue(
      tx,
      process.env.ADMIN_NOTIFICATION_EMAIL,
      event + "_ADMIN",
      reference,
      title,
      body,
    );
}
export async function quoteEmail(
  tx: Prisma.TransactionClient,
  q: any,
  event: string,
  reference = q.id,
) {
  const title = `${q.number} — ${q.status === "NEW" ? "Demande de devis reçue" : labels[q.status] || q.status}`;
  const body = `<p>Bonjour ${escape(q.name)},</p><p>Nous avons bien enregistré votre demande de devis. État du dossier : <strong>${escape(q.status === "NEW" ? "Demande reçue" : labels[q.status] || q.status)}</strong>.</p>${q.items.map((i: any) => `<p><strong>${escape(i.packagingType)}</strong> · ${i.quantity} pièces<br>Dimensions : ${escape(i.dimensions)}<br>Matière : ${escape(i.material)}<br>Impression : ${escape(i.printing)} · Couleurs : ${escape(i.colors)}</p>`).join("")}<p>${escape(q.notes)}</p><p>Notre équipe vous contactera pour préciser votre projet.</p>`;
  await enqueue(tx, q.email, event, reference, title, body);
  if (process.env.ADMIN_NOTIFICATION_EMAIL)
    await enqueue(
      tx,
      process.env.ADMIN_NOTIFICATION_EMAIL,
      event + "_ADMIN",
      reference,
      title,
      body,
    );
}
export async function contactEmail(tx: Prisma.TransactionClient, m: any) {
  const body = `<p>Bonjour ${escape(m.name)},</p><p>Votre message a bien été reçu. Notre équipe vous répondra dès que possible.</p><h2>${escape(m.subject)}</h2><p>${escape(m.message)}</p>`;
  await enqueue(
    tx,
    m.email,
    "CONTACT_RECEIVED",
    m.id,
    "Nous avons reçu votre message",
    body,
  );
  if (process.env.ADMIN_NOTIFICATION_EMAIL)
    await enqueue(
      tx,
      process.env.ADMIN_NOTIFICATION_EMAIL,
      "CONTACT_ADMIN",
      m.id,
      m.subject,
      body,
    );
}
export const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
let running = false;
export async function deliverEmails(onlyId?: string) {
  if (running || !smtpConfigured()) return;
  running = true;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      requireTLS:
        env.NODE_ENV === "production" && process.env.SMTP_SECURE !== "true",
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
      connectionTimeout: 10000,
      socketTimeout: 20000,
    });
    for (let n = 0; n < 20; n++) {
      const mail = await db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<
          Array<{ id: string }>
        >`SELECT id FROM "EmailNotification" WHERE (${onlyId ?? null}::text IS NULL OR id=${onlyId ?? null}) AND (status IN ('PENDING','RETRY') OR (status='SENDING' AND "nextAttemptAt" < NOW())) AND "nextAttemptAt" <= NOW() ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED`;
        if (!rows.length) return null;
        return tx.emailNotification.update({
          where: { id: rows[0].id },
          data: {
            status: "SENDING",
            attempts: { increment: 1 },
            nextAttemptAt: new Date(Date.now() + 300000),
          },
        });
      });
      if (!mail) break;
      try {
        await transport.sendMail({
          from: process.env.MAIL_FROM,
          to: mail.to,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          messageId: `<${mail.id}@indbox.notification>`,
        });
        await db.emailNotification.update({
          where: { id: mail.id },
          data: { status: "SENT", sentAt: new Date(), lastError: null },
        });
      } catch (e) {
        await db.emailNotification.update({
          where: { id: mail.id },
          data: {
            status: mail.attempts >= 5 ? "FAILED" : "RETRY",
            lastError: (e instanceof Error ? e.message : "SMTP error").slice(
              0,
              1000,
            ),
            nextAttemptAt: new Date(
              Date.now() + Math.min(3600000, 60000 * 2 ** mail.attempts),
            ),
          },
        });
      }
    }
    transport.close();
  } finally {
    running = false;
  }
}
export function startMailWorker() {
  const timer = setInterval(
    () => void deliverEmails().catch(console.error),
    15000,
  );
  timer.unref();
  void deliverEmails().catch(console.error);
}

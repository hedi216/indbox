import nodemailer from "nodemailer";
import { smtpOptions } from "./smtp.js";
import {
  withEmailSignature,
  htmlToText,
  deliveryCutoff,
  mailDeliveryReady,
  TRANSACTIONAL_FROM,
} from "./mail-policy.js";
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
const orderMessages: Record<string, string> = {
  NEW: "Merci pour votre commande. Notre équipe vous contactera pour confirmer la livraison et le règlement.",
  CONFIRMED:
    "Votre commande est confirmée. Notre équipe va préparer vos articles.",
  IN_PREPARATION: "Notre équipe prépare actuellement votre commande.",
  READY:
    "Votre commande est prête. Notre équipe vous contactera pour organiser la remise ou la livraison convenue.",
  SHIPPED:
    "Votre commande a été expédiée selon les modalités convenues avec notre équipe.",
  DELIVERED: "Votre commande a été livrée. Merci pour votre confiance !",
  CANCELLED:
    "Votre commande a été annulée. Contactez notre équipe pour toute question.",
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
  options: { sensitive?: boolean; expiresAt?: Date } = {},
) {
  const settings = await tx.siteSetting.findUnique({ where: { key: "site" } });
  const site = settings?.value as any;
  const content = template(
    title,
    body,
    [site?.email, site?.phone, site?.address].filter(Boolean).join(" · "),
  );
  const { html, text } = withEmailSignature(content, htmlToText(content));
  await tx.emailNotification.upsert({
    where: { event_reference_to: { event, reference, to } },
    create: {
      to,
      event,
      reference,
      subject: `IN-D-BOX · ${title}`,
      ...options,
      html,
      text,
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
  const body = `<p>Bonjour ${escape(order.firstName)},</p><p>${orderMessages[order.status] || `Votre commande est maintenant : <strong>${escape(labels[order.status])}</strong>.`}</p><h2 style="font-size:18px">Détail de la commande</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Article</th><th>Qté</th><th align="right">Total</th></tr></thead><tbody>${order.items
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
    )}</tbody></table><p>Sous-total : ${money(order.subtotal)}<br>Promotions : −${money(order.promotionDiscount)}<br>Coupon ${escape(order.couponCode || "")} : −${money(order.couponDiscount)}</p><p style="font-size:22px"><strong>Total : ${money(order.total)}</strong></p><h2 style="font-size:18px">Livraison</h2><p>${escape(order.firstName)} ${escape(order.lastName)}<br>${escape(order.company)}<br>${escape(order.address)}, ${escape(order.city)}<br>${escape(order.phone)}</p>${order.notes ? `<p>Votre note : ${escape(order.notes)}</p>` : ""}<p><a href="${escape(new URL("/account", env.PUBLIC_URL).href)}" style="color:#986416">Consulter mon compte</a></p>`;
  await enqueue(tx, order.email, event, reference, title, body);
  await staffEmail(
    tx,
    event === "ORDER_CREATED" ? "newOrders" : "orderStatus",
    event + "_ADMIN",
    reference,
    title,
    `<p>Alerte équipe : ${escape(title)}</p>${body}<p><a href="${escape(new URL("/admin/orders?q=" + encodeURIComponent(order.number), env.PUBLIC_URL).href)}">Gérer la commande</a></p>`,
    order.email,
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
  await staffEmail(
    tx,
    event === "QUOTE_CREATED" ? "newQuotes" : "quoteStatus",
    event + "_ADMIN",
    reference,
    title,
    `${body}<p><a href="${escape(new URL("/admin/quotes?q=" + encodeURIComponent(q.number), env.PUBLIC_URL).href)}">Gérer le devis ${escape(q.number)}</a></p>`,
    q.email,
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
  await staffEmail(
    tx,
    "contacts",
    "CONTACT_ADMIN",
    m.id,
    m.subject,
    `<p>Nouveau message de ${escape(m.name)} (${escape(m.email)})</p>${body}`,
    m.email,
  );
}
export const smtpConfigured = () => mailDeliveryReady(process.env);
let running = false;
export async function deliverEmails(onlyId?: string) {
  if (running || !smtpConfigured()) return;
  const cutoff = deliveryCutoff(process.env)!;
  running = true;
  try {
    const transport = nodemailer.createTransport(
      smtpOptions({ ...process.env, NODE_ENV: env.NODE_ENV }),
    );
    for (let n = 0; n < 20; n++) {
      const mail = await db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<
          Array<{ id: string }>
        >`SELECT id FROM "EmailNotification" WHERE "createdAt" >= ${cutoff} AND ("expiresAt" IS NULL OR "expiresAt" > NOW()) AND (${onlyId ?? null}::text IS NULL OR id=${onlyId ?? null}) AND (status IN ('PENDING','RETRY') OR (status='SENDING' AND "nextAttemptAt" < NOW())) AND "nextAttemptAt" <= NOW() ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED`;
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
          from: TRANSACTIONAL_FROM,
          replyTo: process.env.MAIL_REPLY_TO || undefined,
          to: mail.to,
          subject: mail.subject,
          ...withEmailSignature(mail.html, mail.text),
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

export const notificationKeys = [
  "newOrders",
  "orderStatus",
  "newQuotes",
  "quoteStatus",
  "contacts",
  "lowStock",
] as const;
export async function staffEmail(
  tx: Prisma.TransactionClient,
  preference: string,
  event: string,
  reference: string,
  title: string,
  body: string,
  exclude?: string,
) {
  const users = await tx.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
  });
  const recipients = new Set(
    users
      .filter(
        (u) =>
          u.active &&
          !u.mustChangePassword &&
          (u.notificationPreferences as Record<string, boolean>)[preference] ===
            true,
      )
      .map((u) => u.email.toLowerCase()),
  );
  const fallback = process.env.ADMIN_NOTIFICATION_EMAIL?.trim().toLowerCase();
  // A staff preference/disabled account takes precedence over the legacy fallback.
  if (fallback && !users.some((u) => u.email.toLowerCase() === fallback))
    recipients.add(fallback);
  if (exclude) recipients.delete(exclude.toLowerCase());
  for (const to of recipients)
    await enqueue(tx, to, event, reference, title, body);
}

export async function lowStockEmail(
  tx: Prisma.TransactionClient,
  item: {
    productId: string;
    variantId?: string | null;
    productName: string;
    sku: string;
    stock: number;
  },
  previousStock: number,
  reference: string,
  orderNumber?: string,
) {
  const configured = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
  const threshold =
    Number.isInteger(configured) && configured >= 0 ? configured : 5;
  if (previousStock <= threshold || item.stock > threshold) return;
  await staffEmail(
    tx,
    "lowStock",
    "LOW_STOCK",
    reference,
    `Stock faible — ${item.productName}`,
    `<p>${escape(item.productName)} · SKU ${escape(item.sku)}</p><p>Stock restant : ${item.stock} unités de vente (seuil : ${threshold}).</p>${orderNumber ? `<p>Commande : ${escape(orderNumber)}</p>` : ""}<p><a href="${escape(new URL("/admin/products?q=" + encodeURIComponent(item.sku), env.PUBLIC_URL).href)}">Consulter le stock</a></p>`,
  );
}

export async function securityEmail(
  tx: Prisma.TransactionClient,
  user: { id: string; email: string; name: string; role: string },
  kind: string,
  reference: string,
  data: { token?: string; password?: string; expiresAt?: Date } = {},
) {
  let title: string, body: string;
  if (kind === "INVITE") {
    title = "Votre accès à IN-D-BOX";
    body = `<p>Adresse de connexion : ${escape(user.email)}</p><p>Mot de passe temporaire : <strong>${escape(data.password)}</strong></p><p>Valable 24 heures, jusqu’au ${data.expiresAt!.toISOString()}. Vous devrez choisir un nouveau mot de passe à la première connexion.</p><p><a href="${escape(new URL("/admin", env.PUBLIC_URL).href)}">Se connecter</a></p>`;
  } else if (kind === "VERIFY" || kind === "RESET") {
    title =
      kind === "VERIFY"
        ? "Bienvenue — vérifiez votre email"
        : "Réinitialiser votre mot de passe";
    // Fragment keeps credentials out of HTTP access logs and Referer headers.
    const url = new URL(
      kind === "VERIFY" ? "/verify-email" : "/reset-password",
      env.PUBLIC_URL,
    );
    url.hash = `token=${data.token}`;
    body = `<p>${kind === "VERIFY" ? "Bienvenue chez IN-D-BOX. Confirmez votre adresse email pour finaliser votre inscription." : "Vous avez demandé à réinitialiser votre mot de passe. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message."}</p><p><a href="${escape(url.href)}">${kind === "VERIFY" ? "Vérifier mon email" : "Choisir un nouveau mot de passe"}</a></p><p>Ce lien à usage unique expire le ${data.expiresAt!.toISOString()}.</p>`;
  } else {
    title =
      kind === "VERIFIED"
        ? "Bienvenue — votre email est vérifié"
        : "Votre mot de passe a été modifié";
    body = `<p>${kind === "VERIFIED" ? "Votre inscription est confirmée. Bienvenue chez IN-D-BOX !" : "Votre mot de passe vient d’être modifié et vos anciennes sessions ont été invalidées. Si vous n’êtes pas à l’origine de ce changement, contactez notre équipe."}</p><p><a href="${escape(new URL("/account", env.PUBLIC_URL).href)}">Mon compte</a></p>`;
  }
  await enqueue(
    tx,
    user.email,
    `SECURITY_${kind}_${reference}`,
    user.id,
    title,
    `<p>Bonjour ${escape(user.name)},</p>${body}`,
    {
      sensitive: ["INVITE", "VERIFY", "RESET"].includes(kind),
      expiresAt: data.expiresAt,
    },
  );
}

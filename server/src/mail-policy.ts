import { z } from "zod";

export const TRANSACTIONAL_FROM = "IN-D-BOX <no-reply@indbox.tn>";
export const EMAIL_SIGNATURE =
  "Email généré par BizzRes, une solution de Comeleon Studio.";
export const EMAIL_SIGNATURE_URL = "https://www.comeleonstudio.com";
const signatureHtml = `<div data-indbox-signature="true"><p>${EMAIL_SIGNATURE}</p><p><a href="${EMAIL_SIGNATURE_URL}">${EMAIL_SIGNATURE_URL}</a></p></div>`;
const signatureText = `${EMAIL_SIGNATURE}\n${EMAIL_SIGNATURE_URL}`;

export function htmlToText(html: string) {
  return html
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, "$2 ($1)")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .trim();
}

// Apply at enqueue and delivery so legacy messages also receive the footer.
export function withEmailSignature(html: string, text: string) {
  html = html.replace(/<div data-indbox-signature="true">[\s\S]*?<\/div>/g, "");
  const bodyEnd = html.search(/<\/body\s*>/i);
  html =
    bodyEnd < 0
      ? html + signatureHtml
      : html.slice(0, bodyEnd) + signatureHtml + html.slice(bodyEnd);
  if (text.trimEnd().endsWith(signatureText)) {
    text = text.trimEnd().slice(0, -signatureText.length);
  }
  return { html, text: `${text.trimEnd()}\n\n${signatureText}` };
}

export function deliveryCutoff(config: NodeJS.ProcessEnv): Date | null {
  const parsed = z
    .string()
    .datetime()
    .safeParse(config.MAIL_DELIVERY_NOT_BEFORE);
  return parsed.success ? new Date(parsed.data) : null;
}

// Fail closed without preventing the storefront or login from starting.
export function mailDeliveryReady(config: NodeJS.ProcessEnv): boolean {
  return (
    config.MAIL_DELIVERY_ENABLED === "true" &&
    deliveryCutoff(config) !== null &&
    Boolean(config.SMTP_HOST?.trim()) &&
    config.MAIL_FROM === TRANSACTIONAL_FROM &&
    (!config.MAIL_REPLY_TO ||
      z.string().email().safeParse(config.MAIL_REPLY_TO).success)
  );
}

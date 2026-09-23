// Single source of truth for contact channels.
// Update WHATSAPP_NUMBER and every consumer (booking page, location picker,
// home, footer, AI chat) automatically picks it up.

export const WHATSAPP_NUMBER = '21612345678'; // TODO: replace with Midou's real WhatsApp
export const PHONE_DISPLAY = '+216 12 345 678';
export const PHONE_TEL = '+21612345678';
export const SUPPORT_EMAIL = 'info@aquasports.tn';

// Build a wa.me deep link with an optional pre-filled message.
export function waLink(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

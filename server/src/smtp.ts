import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

export function smtpOptions(config: NodeJS.ProcessEnv): SMTPTransport.Options {
  const host = config.SMTP_HOST;
  const port = Number(config.SMTP_PORT || 587);
  const secure = config.SMTP_SECURE === "true";
  // The deployed MailEnable relay is bound exclusively to this literal loopback
  // endpoint. Never extend the plaintext exception to names or remote addresses.
  const localMailEnable = host === "127.0.0.1" && port === 25 && !secure;
  return {
    host,
    port,
    secure,
    ignoreTLS: localMailEnable,
    requireTLS: config.NODE_ENV === "production" && !secure && !localMailEnable,
    ...(config.SMTP_USER
      ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
      : {}),
    connectionTimeout: 10000,
    socketTimeout: 20000,
  };
}

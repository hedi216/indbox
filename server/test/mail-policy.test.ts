import { test } from "node:test";
import assert from "node:assert/strict";
import {
  withEmailSignature,
  htmlToText,
  EMAIL_SIGNATURE,
  EMAIL_SIGNATURE_URL,
  TRANSACTIONAL_FROM,
  mailDeliveryReady,
} from "../src/mail-policy.js";

test("central signature ends HTML and text, preserves links and is idempotent", () => {
  const html =
    '<html><body><p>Bonjour &amp; merci</p><a href="https://indbox.tn/account">Compte</a></body></html>';
  const signed = withEmailSignature(html, htmlToText(html));
  assert.ok(signed.text.includes("Compte (https://indbox.tn/account)"));
  assert.ok(signed.text.endsWith(`${EMAIL_SIGNATURE}\n${EMAIL_SIGNATURE_URL}`));
  assert.ok(
    signed.html.endsWith(`${EMAIL_SIGNATURE_URL}</a></p></div></body></html>`),
  );
  assert.deepEqual(withEmailSignature(signed.html, signed.text), signed);
  assert.ok(
    withEmailSignature("<p>Legacy</p>", "Legacy").html.includes(
      EMAIL_SIGNATURE,
    ),
  );
});

test("sending requires explicit activation, valid UTC cutoff and mandated sender", () => {
  const config = {
    SMTP_HOST: "localhost",
    MAIL_FROM: TRANSACTIONAL_FROM,
    MAIL_DELIVERY_ENABLED: "true",
    MAIL_DELIVERY_NOT_BEFORE: "2026-10-09T12:00:00.000Z",
  };
  assert.equal(mailDeliveryReady(config), true);
  for (const changes of [
    { MAIL_DELIVERY_ENABLED: undefined },
    { MAIL_DELIVERY_ENABLED: "false" },
    { MAIL_DELIVERY_NOT_BEFORE: "" },
    { MAIL_DELIVERY_NOT_BEFORE: "invalid" },
    { MAIL_DELIVERY_NOT_BEFORE: "2026-10-09" },
    { SMTP_HOST: "" },
    { MAIL_FROM: "wrong@example.com" },
    { MAIL_REPLY_TO: "invalid" },
  ])
    assert.equal(mailDeliveryReady({ ...config, ...changes }), false);
});

test("production SMTP permits plaintext only for the exact MailEnable loopback endpoint", async () => {
  const { smtpOptions } = await import("../src/smtp.js");
  const config = {
    NODE_ENV: "production",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "25",
    SMTP_SECURE: "false",
    SMTP_USER: "",
    SMTP_PASS: "",
  };
  const local = smtpOptions(config);
  assert.equal(local.requireTLS, false);
  assert.equal(local.ignoreTLS, true);
  assert.equal(local.auth, undefined);
  for (const changes of [
    { SMTP_HOST: "smtp.example.com" },
    { SMTP_HOST: "localhost" },
    { SMTP_HOST: "127.0.0.1.example.com" },
    { SMTP_PORT: "587" },
  ]) {
    const remote = smtpOptions({ ...config, ...changes });
    assert.equal(remote.requireTLS, true);
    assert.equal(remote.ignoreTLS, false);
  }
  const implicit = smtpOptions({
    ...config,
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
  });
  assert.equal(implicit.secure, true);
  assert.equal(implicit.ignoreTLS, false);
});

import "dotenv/config";
import nodemailer from "nodemailer";
import { smtpOptions } from "../src/smtp.js";
import { spawn } from "node:child_process";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Socket } from "node:net";
import { randomUUID } from "node:crypto";
import { deliverEmails } from "../src/mail.js";
import { db } from "../src/db.js";
const prefix = "smtp-test-" + randomUUID();
after(async () => {
  await db.emailNotification.deleteMany({ where: { reference: prefix } });
  await db.$disconnect();
});
test("SMTP outbox sends MIME message, skips sent messages and retries failures", async () => {
  const payloads: string[] = [];
  let reject = false;
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 local-test ESMTP\r\n");
    let buffer = "",
      dataMode = false,
      payload = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (dataMode) {
          if (line === ".") {
            dataMode = false;
            payloads.push(payload);
            payload = "";
            socket.write("250 accepted\r\n");
          } else payload += line + "\r\n";
        } else if (line.startsWith("EHLO"))
          socket.write("250-local-test\r\n250 PIPELINING\r\n");
        else if (line.startsWith("DATA")) {
          dataMode = true;
          socket.write("354 send message\r\n");
        } else if (line.startsWith("QUIT")) socket.end("221 bye\r\n");
        else if (line.startsWith("RCPT") && reject)
          socket.write("450 temporary failure\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as any).port;
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "";
  process.env.MAIL_FROM = "IN-D-BOX <no-reply@indbox.tn>";
  process.env.MAIL_REPLY_TO = "contact@indbox.tn";
  process.env.MAIL_DELIVERY_ENABLED = "false";
  process.env.MAIL_DELIVERY_NOT_BEFORE = new Date(
    Date.now() - 1000,
  ).toISOString();
  try {
    const mail = await db.emailNotification.create({
      data: {
        to: "smtp-test@example.com",
        subject: "Test confirmation détaillée",
        html: "<h1>Commande INDB-TEST</h1><p>35.000 TND</p>",
        text: "Commande INDB-TEST — 35.000 TND",
        event: "SMTP_TEST",
        reference: prefix,
        nextAttemptAt: new Date(0),
      },
    });
    await deliverEmails(mail.id);
    assert.equal(
      payloads.length,
      0,
      "SMTP credentials alone must not activate sending",
    );
    process.env.MAIL_DELIVERY_ENABLED = "true";
    const old = await db.emailNotification.create({
      data: {
        to: "old@example.com",
        subject: "Old test",
        html: "old",
        text: "old",
        event: "OLD_TEST",
        reference: prefix,
        createdAt: new Date(0),
      },
    });
    for (const status of ["PENDING", "RETRY", "SENDING"]) {
      await db.emailNotification.update({
        where: { id: old.id },
        data: { status, nextAttemptAt: new Date(0) },
      });
      await deliverEmails(old.id);
      assert.equal(
        payloads.length,
        0,
        `old ${status} message must remain held`,
      );
    }
    const expired = await db.emailNotification.create({
      data: {
        to: "expired@example.com",
        subject: "Expired credentials",
        html: "expired",
        text: "expired",
        event: "EXPIRED_SECURITY",
        reference: prefix,
        sensitive: true,
        expiresAt: new Date(0),
      },
    });
    await deliverEmails(expired.id);
    assert.equal(
      payloads.length,
      0,
      "expired security mail must never be sent",
    );
    await deliverEmails(mail.id);
    let saved = await db.emailNotification.findUniqueOrThrow({
      where: { id: mail.id },
    });
    assert.equal(saved.status, "SENT");
    assert.equal(saved.attempts, 1);
    assert.ok(saved.sentAt);
    assert.equal(payloads.length, 1);
    assert.ok(payloads[0].includes("multipart/alternative"));
    assert.ok(payloads[0].includes(mail.id));
    const decoded = payloads[0]
      .replace(/=\r\n/g, "")
      .replace(/=([0-9A-F]{2})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16)),
      );
    assert.match(decoded, /From: "?IN-D-BOX"? <no-reply@indbox\.tn>/);
    assert.match(decoded, /Reply-To: contact@indbox.tn/);
    assert.equal(
      (decoded.match(/une solution de Comeleon Studio/g) || []).length,
      2,
    );
    assert.ok(decoded.includes("https://www.comeleonstudio.com"));
    await deliverEmails(mail.id);
    assert.equal(payloads.length, 1);
    const failing = await db.emailNotification.create({
      data: {
        to: "smtp-fail@example.com",
        subject: "SMTP retry",
        html: "<p>Retry</p>",
        text: "Retry",
        event: "SMTP_FAIL",
        reference: prefix,
        nextAttemptAt: new Date(0),
      },
    });
    reject = true;
    await deliverEmails(failing.id);
    saved = await db.emailNotification.findUniqueOrThrow({
      where: { id: failing.id },
    });
    assert.equal(saved.status, "RETRY");
    assert.ok(saved.lastError?.includes("450"));
    assert.ok(saved.nextAttemptAt > new Date());
    await db.emailNotification.update({
      where: { id: failing.id },
      data: { attempts: 4, nextAttemptAt: new Date(0) },
    });
    await deliverEmails(failing.id);
    assert.equal(
      (
        await db.emailNotification.findUniqueOrThrow({
          where: { id: failing.id },
        })
      ).status,
      "FAILED",
    );
    reject = false;
    // Same production loopback policy against an ephemeral local sink port.
    const localTransport = nodemailer.createTransport({
      ...smtpOptions({
        NODE_ENV: "production",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "25",
        SMTP_SECURE: "false",
      }),
      port,
    });
    try {
      await localTransport.sendMail({
        from: "no-reply@indbox.tn",
        to: "operator@example.com",
        text: "Loopback SMTP policy test",
      });
    } finally {
      localTransport.close();
    }
    assert.equal(payloads.length, 2);
    const rowsBefore = await db.emailNotification.count({
      where: { reference: prefix },
    });
    const runCheck = (args: string[]) =>
      new Promise<{ code: number | null; output: string }>(
        (resolve, reject) => {
          const child = spawn(
            process.execPath,
            ["dist/mail-check.js", ...args],
            {
              env: {
                ...process.env,
                NODE_ENV: "test",
                MAIL_DELIVERY_ENABLED: "false",
                MAIL_REPLY_TO: "",
              },
              stdio: ["ignore", "pipe", "pipe"],
            },
          );
          let output = "";
          child.stdout.on("data", (chunk) => (output += chunk));
          child.stderr.on("data", (chunk) => (output += chunk));
          child.on("error", reject);
          child.on("exit", (code) => resolve({ code, output }));
        },
      );
    assert.notEqual((await runCheck([])).code, 0);
    assert.equal(
      payloads.length,
      2,
      "no diagnostic without an explicit recipient",
    );
    const diagnostic = await runCheck(["--to", "operator@example.com"]);
    assert.equal(diagnostic.code, 0, diagnostic.output);
    assert.equal(payloads.length, 3);
    assert.match(payloads[2].replace(/=\r\n/g, ""), /Comeleon Studio/);
    assert.ok(!payloads[2].includes("Reply-To:"));
    assert.equal(
      await db.emailNotification.count({ where: { reference: prefix } }),
      rowsBefore,
    );
    assert.equal(
      (
        await db.emailNotification.findUniqueOrThrow({
          where: { id: expired.id },
        })
      ).status,
      "PENDING",
    );
  } finally {
    for (const s of sockets) s.destroy();
    await new Promise<void>((r) => server.close(() => r()));
  }
});

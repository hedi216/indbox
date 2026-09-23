import "dotenv/config";
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
  process.env.MAIL_FROM = "IN-D-BOX <test@example.com>";
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
    let saved = await db.emailNotification.findUniqueOrThrow({
      where: { id: mail.id },
    });
    assert.equal(saved.status, "SENT");
    assert.equal(saved.attempts, 1);
    assert.ok(saved.sentAt);
    assert.equal(payloads.length, 1);
    assert.ok(payloads[0].includes("multipart/alternative"));
    assert.ok(payloads[0].includes(mail.id));
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
  } finally {
    for (const s of sockets) s.destroy();
    await new Promise<void>((r) => server.close(() => r()));
  }
});

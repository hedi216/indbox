import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, transaction } from "../src/db.js";
import {
  orderEmail,
  quoteEmail,
  contactEmail,
  lowStockEmail,
} from "../src/mail.js";
import { hashToken } from "../src/security.js";
const prefix = `security-${randomUUID()}`;
const base = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
class Session {
  cookie = "";
  async call(
    path: string,
    body?: unknown,
    method = body === undefined ? "GET" : "POST",
  ) {
    const r = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: this.cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const cookie = r.headers
      .getSetCookie()
      .find((c) => c.startsWith("access_token="));
    if (cookie) this.cookie = cookie.split(";")[0];
    return { status: r.status, ...(await r.json()) };
  }
}
const admin = new Session(),
  customer = new Session();
const email = `${prefix}@example.com`,
  password = "Secure-Customer-2026!";
const prefs = {
  newOrders: true,
  orderStatus: true,
  newQuotes: true,
  quoteStatus: true,
  contacts: true,
  lowStock: true,
};
async function message(to: string, kind: string) {
  return db.emailNotification.findFirstOrThrow({
    where: { to, event: { startsWith: `SECURITY_${kind}_` } },
    orderBy: { createdAt: "desc" },
  });
}
async function token(to: string, kind: string) {
  return (await message(to, kind)).html.match(/#token=([a-f0-9]{64})/)![1];
}
after(async () => {
  await db.emailNotification.deleteMany({
    where: {
      OR: [{ to: { contains: prefix } }, { reference: { startsWith: prefix } }],
    },
  });
  await db.customer.deleteMany({ where: { email: { contains: prefix } } });
  const users = await db.user.findMany({
    where: { email: { contains: prefix } },
    select: { id: true },
  });
  await db.auditLog.deleteMany({
    where: { entityId: { in: users.map((u) => u.id) } },
  });
  await db.user.deleteMany({ where: { email: { contains: prefix } } });
  await db.$disconnect();
});
test("account security, onboarding and staff notification workflows", async (t) => {
  assert.equal(
    (
      await admin.call("/auth/login", {
        email: process.env.SEED_ADMIN_EMAIL || "admin@indbox.local",
        password: process.env.SEED_ADMIN_PASSWORD || "Indbox-Dev-2026!",
      })
    ).status,
    200,
  );
  if (process.env.LEGACY_TEST_COOKIE)
    await t.test(
      "migration preserves existing password and session without verification lockout",
      async () => {
        const legacy = new Session();
        legacy.cookie = `access_token=${process.env.LEGACY_TEST_COOKIE}`;
        const me = await legacy.call("/auth/me");
        assert.equal(me.status, 200);
        assert.equal(me.data.emailVerified, true);
        assert.equal(me.data.mustChangePassword, false);
        assert.equal(
          (
            await legacy.call("/auth/login", {
              email: "legacy-migration@example.com",
              password: "legacy-password",
            })
          ).status,
          200,
        );
      },
    );
  await t.test(
    "shared policy rejects missing password requirements",
    async () => {
      for (const invalid of [
        "shortA1!",
        "alllowercase123!",
        "ALLUPPERCASE123!",
        "NoNumbersHere!",
        "NoSpecialChars123",
        "Aa1!" + "é".repeat(35),
      ]) {
        assert.equal(
          (
            await customer.call("/auth/register", {
              firstName: "Security",
              lastName: "Test",
              phone: "22000000",
              email,
              password: invalid,
            })
          ).status,
          422,
        );
      }
    },
  );
  await t.test(
    "registration, welcome, token hashing, cooldown, resend and single-use verification",
    async () => {
      await db.customer.create({
        data: {
          firstName: "Guest",
          lastName: "History",
          email,
          phone: "22000000",
        },
      });
      const r = await customer.call("/auth/register", {
        firstName: "Security",
        lastName: "Test",
        phone: "22000000",
        email,
        password,
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.emailVerified, false);
      assert.equal(
        (await db.customer.findUniqueOrThrow({ where: { email } })).userId,
        null,
      );
      const raw = await token(email, "VERIFY");
      const stored = await db.userSecurityToken.findUniqueOrThrow({
        where: { tokenHash: hashToken(raw) },
      });
      assert.notEqual(stored.tokenHash, raw);
      assert.ok(
        stored.expiresAt.getTime() - stored.createdAt.getTime() <= 86401000,
      );
      await customer.call("/auth/resend-verification", { email });
      assert.equal(await token(email, "VERIFY"), raw);
      await db.userSecurityToken.updateMany({
        where: { userId: r.data.id },
        data: { createdAt: new Date(Date.now() - 120000) },
      });
      await customer.call("/auth/resend-verification", { email });
      assert.equal(
        (await customer.call("/auth/verify-email", { token: raw })).status,
        400,
      );
      const newer = await token(email, "VERIFY");
      await customer.call("/auth/logout", {});
      assert.equal(
        (await customer.call("/auth/login", { email, password })).status,
        200,
      );
      await db.userSecurityToken.update({
        where: { tokenHash: hashToken(newer) },
        data: { expiresAt: new Date(0) },
      });
      assert.equal(
        (await customer.call("/auth/verify-email", { token: newer })).status,
        400,
      );
      await db.userSecurityToken.update({
        where: { tokenHash: hashToken(newer) },
        data: { expiresAt: new Date(Date.now() + 86400000) },
      });
      const results = await Promise.all([
        new Session().call("/auth/verify-email", { token: newer }),
        new Session().call("/auth/verify-email", { token: newer }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
      assert.equal((await customer.call("/auth/me")).data.emailVerified, true);
      assert.equal(
        (await db.customer.findUniqueOrThrow({ where: { email } })).userId,
        r.data.id,
      );
      assert.ok((await message(email, "VERIFIED")).text.includes("Bienvenue"));
    },
  );
  await t.test(
    "forgot-password is generic; reset expires, is single use and revokes all sessions",
    async () => {
      const unknown = await customer.call("/auth/forgot-password", {
        email: `missing-${email}`,
      });
      const known = await customer.call("/auth/forgot-password", { email });
      assert.deepEqual(known, unknown);
      const raw = await token(email, "RESET");
      assert.equal(
        (
          await customer.call("/auth/reset-password", {
            token: raw,
            password: "weak",
          })
        ).status,
        422,
      );
      const stored = await db.userSecurityToken.findUniqueOrThrow({
        where: { tokenHash: hashToken(raw) },
      });
      await db.userSecurityToken.update({
        where: { id: stored.id },
        data: { expiresAt: new Date(0) },
      });
      assert.equal(
        (await customer.call("/auth/reset-password", { token: raw, password }))
          .status,
        400,
      );
      await db.userSecurityToken.update({
        where: { id: stored.id },
        data: { expiresAt: new Date(Date.now() + 3600000) },
      });
      const old = new Session();
      old.cookie = customer.cookie;
      const attempts = await Promise.all([
        new Session().call("/auth/reset-password", {
          token: raw,
          password: "Updated-Customer-2026!",
        }),
        new Session().call("/auth/reset-password", {
          token: raw,
          password: "Updated-Customer-2026!",
        }),
      ]);
      assert.deepEqual(attempts.map((r) => r.status).sort(), [200, 400]);
      assert.equal((await old.call("/auth/me")).status, 401);
      assert.equal(
        (await customer.call("/auth/login", { email, password })).status,
        401,
      );
      assert.equal(
        (
          await customer.call("/auth/login", {
            email,
            password: "Updated-Customer-2026!",
          })
        ).status,
        200,
      );
      assert.ok(
        (await message(email, "PASSWORD_CHANGED")).text.includes(
          "anciennes sessions",
        ),
      );
    },
  );
  let staff: any, staffPassword: string;
  const employee = new Session();
  await t.test(
    "automatic employee onboarding and server-side first-login restrictions",
    async () => {
      const r = await admin.call("/admin/users", {
        name: "Security Manager",
        email: `manager-${email}`,
        role: "MANAGER",
        notificationPreferences: prefs,
      });
      assert.equal(r.status, 201);
      staff = r.data;
      assert.equal(staff.mustChangePassword, true);
      assert.ok(!("passwordHash" in staff));
      const invite = await message(staff.email, "INVITE");
      staffPassword = invite.html.match(
        /Mot de passe temporaire : <strong>([^<]+)</,
      )![1];
      assert.ok(invite.sensitive);
      assert.ok(invite.expiresAt);
      assert.ok(
        invite.text.includes(new URL("/admin", process.env.PUBLIC_URL!).href),
      );
      assert.equal(
        (await admin.call(`/admin/notifications/${invite.id}`)).data.text,
        "Contenu de sécurité confidentiel.",
      );
      assert.equal(
        (await admin.call(`/admin/notifications/${invite.id}/retry`, {}))
          .status,
        409,
      );
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: staffPassword,
          })
        ).status,
        200,
      );
      for (const path of ["/admin/dashboard", "/admin/products", "/orders"])
        assert.equal((await employee.call(path)).status, 403);
      assert.equal(
        (await employee.call("/auth/me", { name: "Unauthorized" }, "PATCH"))
          .status,
        403,
      );
      assert.equal((await employee.call("/uploads/products", {})).status, 403);
      const old = new Session();
      old.cookie = employee.cookie;
      assert.equal(
        (
          await employee.call("/auth/change-password", {
            currentPassword: staffPassword,
            password: "weak",
          })
        ).status,
        422,
      );
      assert.equal(
        (
          await employee.call("/auth/change-password", {
            currentPassword: staffPassword,
            password: "Staff-New-2026!",
          })
        ).status,
        200,
      );
      assert.equal((await old.call("/auth/me")).status, 401);
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: "Staff-New-2026!",
          })
        ).status,
        200,
      );
      assert.equal((await employee.call("/admin/products")).status, 200);
      assert.equal(
        (await employee.call(`/admin/users/${staff.id}/credentials`, {}))
          .status,
        403,
      );
    },
  );
  await t.test(
    "all staff preferences, eligibility, deduplication and low-stock threshold crossing",
    async () => {
      const disabled = await admin.call("/admin/users", {
        name: "Disabled Staff",
        email: `disabled-${email}`,
        role: "ADMIN",
        active: false,
        notificationPreferences: prefs,
      });
      const muted = await admin.call("/admin/users", {
        name: "Muted Staff",
        email: `muted-${email}`,
        role: "ADMIN",
        notificationPreferences: {},
      });
      await db.user.update({
        where: { id: muted.data.id },
        data: { mustChangePassword: false },
      });
      process.env.ADMIN_NOTIFICATION_EMAIL = staff.email;
      const order = {
        id: prefix + "-order",
        number: "INDB-TEST-123",
        status: "NEW",
        email,
        firstName: "Security",
        items: [],
        total: 0,
      };
      const quote = {
        id: prefix + "-quote",
        number: "DEV-TEST-123",
        status: "NEW",
        email,
        name: "Security",
        items: [],
      };
      await transaction(async (tx) => {
        await orderEmail(tx, order, "ORDER_CREATED");
        await orderEmail(tx, order, "ORDER_CREATED");
        await orderEmail(
          tx,
          { ...order, status: "SHIPPED" },
          "ORDER_STATUS",
          prefix + "-status",
        );
        await quoteEmail(tx, quote, "QUOTE_CREATED");
        await quoteEmail(
          tx,
          { ...quote, status: "QUOTED" },
          "QUOTE_STATUS",
          prefix + "-quote-status",
        );
        await contactEmail(tx, {
          id: prefix + "-contact",
          email,
          name: "Test",
          subject: "Question",
          message: "Hello",
        });
        await lowStockEmail(
          tx,
          {
            productId: "test",
            productName: "Test stock",
            sku: "SKU",
            stock: 5,
          },
          6,
          prefix + "-stock",
          order.number,
        );
        await lowStockEmail(
          tx,
          {
            productId: "test",
            productName: "Test stock",
            sku: "SKU",
            stock: 4,
          },
          5,
          prefix + "-stock-again",
        );
      });
      const mails = await db.emailNotification.findMany({
        where: {
          to: staff.email,
          sensitive: false,
          reference: { startsWith: prefix },
        },
      });
      assert.equal(mails.length, 6);
      assert.equal(
        mails.filter((m) => m.event === "ORDER_CREATED_ADMIN").length,
        1,
      );
      assert.equal(mails.filter((m) => m.event === "LOW_STOCK").length, 1);
      for (const m of mails)
        assert.ok(m.text.endsWith("https://www.comeleonstudio.com"));
      assert.equal(
        await db.emailNotification.count({
          where: {
            to: { in: [disabled.data.email, muted.data.email] },
            sensitive: false,
          },
        }),
        0,
      );
      // Individual opt-out overrides a matching legacy fallback.
      await db.user.update({
        where: { id: staff.id },
        data: { notificationPreferences: {} },
      });
      await transaction((tx) =>
        orderEmail(tx, order, "ORDER_STATUS", prefix + "-muted-status"),
      );
      assert.equal(
        await db.emailNotification.count({
          where: { to: staff.email, reference: prefix + "-muted-status" },
        }),
        0,
      );
    },
  );
  await t.test(
    "regeneration cancels old credentials, tokens and sessions; 24-hour expiry enforced",
    async () => {
      const oldCookie = employee.cookie;
      assert.equal(
        (await admin.call(`/admin/users/${staff.id}/credentials`, {})).status,
        200,
      );
      employee.cookie = oldCookie;
      assert.equal((await employee.call("/auth/me")).status, 401);
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: "Staff-New-2026!",
          })
        ).status,
        401,
      );
      const first = await message(staff.email, "INVITE");
      const firstPassword = first.html.match(
        /Mot de passe temporaire : <strong>([^<]+)</,
      )![1];
      await admin.call(`/admin/users/${staff.id}/credentials`, {});
      assert.equal(
        (
          await db.emailNotification.findUniqueOrThrow({
            where: { id: first.id },
          })
        ).status,
        "CANCELLED",
      );
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: firstPassword,
          })
        ).status,
        401,
      );
      const latest = (await message(staff.email, "INVITE")).html.match(
        /Mot de passe temporaire : <strong>([^<]+)</,
      )![1];
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: latest,
          })
        ).status,
        200,
      );
      await db.user.update({
        where: { id: staff.id },
        data: { temporaryPasswordExpiresAt: new Date(0) },
      });
      assert.equal(
        (
          await employee.call("/auth/change-password", {
            currentPassword: latest,
            password: "Staff-Final-2026!",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await employee.call("/auth/login", {
            email: staff.email,
            password: latest,
          })
        ).status,
        401,
      );
    },
  );
});

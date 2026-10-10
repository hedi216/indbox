import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const unique = `browser-security-${Date.now()}`;
async function securityMail(email: string, kind: string) {
  return db.emailNotification.findFirstOrThrow({
    where: { to: email, event: { startsWith: `SECURITY_${kind}_` } },
    orderBy: { createdAt: "desc" },
  });
}
async function mailLink(email: string, kind: string) {
  const html = (await securityMail(email, kind)).html;
  return new URL(html.match(/href="([^"]+#token=[a-f0-9]+)"/)![1]);
}
test.afterAll(async () => {
  await db.$disconnect();
});
test("customer password indicators, verification/resend, reset and password-change confirmation", async ({
  page,
}) => {
  const email = `${unique}@example.com`;
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Nouveau ici ? Créer un compte" })
    .click();
  await page.getByLabel("Prénom", { exact: true }).fill("Security");
  await page.getByLabel("Nom", { exact: true }).fill("Browser");
  await page.getByLabel("Téléphone", { exact: true }).fill("22000000");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("weak");
  await expect(
    page.locator('.password-rules li[data-valid="false"]'),
  ).not.toHaveCount(0);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Browser-Security-2026!");
  await expect(
    page.locator('.password-rules li[data-valid="false"]'),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Créer mon compte", exact: true })
    .click();
  await expect(
    page.getByText(
      "Vérifiez votre adresse email grâce au lien envoyé lors de l’inscription.",
    ),
  ).toBeVisible();
  const first = await mailLink(email, "VERIFY");
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  await db.userSecurityToken.updateMany({
    where: { userId: user.id },
    data: { createdAt: new Date(Date.now() - 120000) },
  });
  await page
    .getByRole("link", { name: "Renvoyer la vérification", exact: true })
    .click();
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Si ce compte est éligible",
  );
  await page.goto(first.pathname + first.hash);
  await page.getByRole("button", { name: "Confirmer mon email" }).click();
  await expect(page.locator(".notice.error")).toContainText(
    "invalide ou expiré",
  );
  const verify = await mailLink(email, "VERIFY");
  expect(verify.origin).toBe("https://indbox.tn");
  await page.goto(verify.pathname + verify.hash);
  await page.getByRole("button", { name: "Confirmer mon email" }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Votre email est vérifié",
  );
  expect((await securityMail(email, "VERIFIED")).text).toContain("Bienvenue");
  await page.goto("/account");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(
    page.getByRole("heading", { name: "Mot de passe oublié", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Si ce compte est éligible",
  );
  const reset = await mailLink(email, "RESET");
  await page.goto(reset.pathname + reset.hash);
  await page
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("Browser-Reset-2026!");
  await page
    .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
    .fill("Mismatch-2026!");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.locator(".notice.error")).toContainText(
    "ne correspondent pas",
  );
  await page
    .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
    .fill("Browser-Reset-2026!");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Mot de passe modifié",
  );
  await page.goto(reset.pathname + reset.hash);
  await page
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("Browser-Other-2026!");
  await page
    .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
    .fill("Browser-Other-2026!");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.locator(".notice.error")).toContainText(
    "invalide ou expiré",
  );
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Browser-Reset-2026!");
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await page
    .getByRole("link", { name: "Changer mon mot de passe", exact: true })
    .click();
  await page
    .getByLabel("Mot de passe actuel", { exact: true })
    .fill("Browser-Reset-2026!");
  await page
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("Browser-Final-2026!");
  await page
    .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
    .fill("Browser-Final-2026!");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Mot de passe modifié",
  );
  expect((await securityMail(email, "PASSWORD_CHANGED")).text).toContain(
    "https://www.comeleonstudio.com",
  );
});

test("admin onboarding, mandatory change, preferences and operational notifications", async ({
  page,
  browser,
}) => {
  const email = `staff-${unique}@example.com`,
    name = "Browser Staff " + unique;
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@indbox.local");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Indbox-Dev-2026!");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.getByRole("link", { name: "Utilisateurs", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  await page.getByLabel("Nom", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  for (const label of [
    "Nouvelles commandes",
    "Statuts des commandes",
    "Nouveaux devis",
    "Statuts des devis",
    "Messages de contact",
    "Stock faible",
  ])
    await page.getByRole("checkbox", { name: label, exact: true }).check();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator("tbody")).toContainText(name);
  const invite = await securityMail(email, "INVITE");
  const temporary = invite.html.match(
    /Mot de passe temporaire : <strong>([^<]+)</,
  )![1];
  const context = await browser.newContext();
  const employee = await context.newPage();
  await employee.goto(process.env.E2E_BASE_URL + "/admin");
  await employee.getByLabel("Email", { exact: true }).fill(email);
  await employee.getByLabel("Mot de passe", { exact: true }).fill(temporary);
  await employee
    .getByRole("button", { name: "Se connecter", exact: true })
    .click();
  await expect(
    employee.getByRole("heading", { name: "Changer mon mot de passe" }),
  ).toBeVisible();
  expect(
    (
      await employee.request.get(
        process.env.E2E_BASE_URL + "/api/admin/products",
      )
    ).status(),
  ).toBe(403);
  await employee
    .getByLabel("Mot de passe actuel", { exact: true })
    .fill(temporary);
  await employee
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill("Browser-Staff-2026!");
  await employee
    .getByLabel("Confirmer le nouveau mot de passe", { exact: true })
    .fill("Browser-Staff-2026!");
  await employee.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(employee.getByLabel("Email", { exact: true })).toBeVisible();
  await employee.getByLabel("Email", { exact: true }).fill(email);
  await employee
    .getByLabel("Mot de passe", { exact: true })
    .fill("Browser-Staff-2026!");
  await employee
    .getByRole("button", { name: "Se connecter", exact: true })
    .click();
  await expect(
    employee.getByRole("heading", { name: "Vue d’ensemble" }),
  ).toBeVisible();
  const call = async (path: string, data: any, method = "post") => {
    const r = await page.request.fetch("/api" + path, { method, data });
    expect(r.ok(), await r.text()).toBe(true);
    return (await r.json()).data;
  };
  const category = await db.category.findFirstOrThrow();
  const product = await call("/admin/products", {
    name: unique,
    slug: unique,
    sku: unique,
    categoryId: category.id,
    price: 10,
    stock: 6,
    trackStock: true,
    orderUnit: "UNIT",
    quantityPerLot: 1,
    images: [],
    variants: [],
  });
  const guest = await browser.newContext({ baseURL: process.env.E2E_BASE_URL });
  await guest.request.get("/api/cart");
  expect(
    (
      await guest.request.put("/api/cart", {
        data: { items: [{ productId: product.id, quantity: 2 }] },
      })
    ).ok(),
  ).toBe(true);
  const customerEmail = `order-${unique}@example.com`;
  const orderBody = {
    firstName: "Browser",
    lastName: "Test",
    email: customerEmail,
    phone: "22000000",
    address: "Test Street",
    city: "Tunis",
  };
  const key = crypto.randomUUID();
  const response = await guest.request.post("/api/orders", {
    headers: { "Idempotency-Key": key },
    data: orderBody,
  });
  expect(response.ok(), await response.text()).toBe(true);
  const order = (await response.json()).data;
  await guest.request.post("/api/orders", {
    headers: { "Idempotency-Key": key },
    data: orderBody,
  });
  expect(
    await db.emailNotification.count({
      where: { to: email, event: "ORDER_CREATED_ADMIN", reference: order.id },
    }),
  ).toBe(1);
  expect(
    await db.emailNotification.count({
      where: {
        to: email,
        event: "LOW_STOCK",
        reference: { startsWith: order.id },
      },
    }),
  ).toBe(1);
  await call(
    `/admin/orders/${order.id}/status`,
    { status: "CONFIRMED" },
    "patch",
  );
  const count = await db.emailNotification.count({
    where: { to: email, event: "ORDER_STATUS_ADMIN" },
  });
  expect(
    (
      await page.request.patch(`/api/admin/orders/${order.id}/status`, {
        data: { status: "CONFIRMED" },
      })
    ).status(),
  ).toBe(409);
  expect(
    await db.emailNotification.count({
      where: { to: email, event: "ORDER_STATUS_ADMIN" },
    }),
  ).toBe(count);
  const quoteResponse = await guest.request.post("/api/quotes", {
    data: {
      name: "Browser",
      email: customerEmail,
      phone: "22000000",
      items: [{ packagingType: "Box", quantity: 500 }],
      files: [],
    },
  });
  expect(quoteResponse.ok()).toBe(true);
  const quote = (await quoteResponse.json()).data;
  await call(`/admin/quotes/${quote.id}`, { status: "REVIEWING" }, "patch");
  await guest.request.post("/api/contact", {
    data: {
      name: "Browser",
      email: customerEmail,
      subject: "Browser contact",
      message: "Please contact our company.",
    },
  });
  for (const event of [
    "QUOTE_CREATED_ADMIN",
    "QUOTE_STATUS_ADMIN",
    "CONTACT_ADMIN",
  ])
    expect(
      await db.emailNotification.count({ where: { to: email, event } }),
    ).toBeGreaterThan(0);
  await page.goto("/admin/users?q=" + encodeURIComponent(email));
  await page.getByRole("button", { name: "Modifier " + name }).click();
  await page
    .getByRole("checkbox", { name: "Messages de contact", exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const contacts = await db.emailNotification.count({
    where: { to: email, event: "CONTACT_ADMIN" },
  });
  await guest.request.post("/api/contact", {
    data: {
      name: "Browser",
      email: customerEmail,
      subject: "Muted contact",
      message: "This should not notify staff.",
    },
  });
  expect(
    await db.emailNotification.count({
      where: { to: email, event: "CONTACT_ADMIN" },
    }),
  ).toBe(contacts);
  await page.getByRole("button", { name: "Modifier " + name }).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Régénérer et envoyer les identifiants" })
    .click();
  await expect(page.getByRole("status")).toContainText("identifiants");
  expect(
    (
      await employee.request.get(
        process.env.E2E_BASE_URL + "/api/admin/products",
      )
    ).status(),
  ).toBe(401);
  await call(
    `/admin/orders/${order.id}/status`,
    { status: "CANCELLED" },
    "patch",
  );
  await guest.close();
  await context.close();
});

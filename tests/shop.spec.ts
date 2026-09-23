import { test, expect } from "@playwright/test";
const email = `browser-${Date.now()}@example.com`;
test("desktop storefront, exact variant cart, coupon, checkout and admin timeline", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "packaging",
  );
  await expect(page.locator(".product-card")).toHaveCount(8);
  await expect(page.locator(".category-card")).toHaveCount(4);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/product/doypack-noir");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Doypack noir",
  );
  await expect(page.locator(".detail-price strong")).toContainText("27,000");
  await page.getByRole("button", { name: /12 × 20 cm/ }).click();
  await expect(page.locator(".detail-price strong")).toContainText("35,000");
  await page.getByLabel("Quantité", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByRole("status")).toContainText("Produit ajouté");
  await page.getByRole("link", { name: "Panier", exact: true }).click();
  await expect(page.locator(".cart-line")).toContainText("12 × 20 cm");
  await page.getByLabel("Un code promo ?").fill("WELCOME10");
  await page.getByLabel("Email pour vérifier votre coupon").fill(email);
  await page.getByRole("button", { name: "Appliquer le coupon" }).click();
  await expect(page.locator(".grand-total")).toContainText("63,000");
  await page.getByRole("link", { name: "Passer commande" }).click();
  await page.getByLabel("Prénom", { exact: true }).fill("Browser");
  await page.getByLabel("Nom", { exact: true }).fill("Verification");
  await page.getByLabel("Téléphone", { exact: true }).fill("+21622000000");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Adresse de livraison").fill("15 rue du Test");
  await page.getByLabel("Ville", { exact: true }).fill("Tunis");
  await page.getByRole("button", { name: "Confirmer ma commande" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Votre commande est enregistrée.",
  );
  const reference = await page.locator(".confirmation>p strong").innerText();
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@indbox.local");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Indbox-Dev-2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble" }),
  ).toBeVisible();
  await expect(page.locator(".stats-grid .stat")).toHaveCount(10);
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.goto("/admin/orders?q=" + reference);
  await expect(page.locator("tbody")).toContainText(reference);
  await page.getByRole("button", { name: "Voir le détail" }).click();
  await expect(page.getByRole("dialog")).toContainText("12 × 20 cm");
  await page.getByLabel("Nouveau statut").selectOption("CONFIRMED");
  await page.getByLabel("Note interne").fill("Vérification navigateur");
  await page
    .getByRole("button", { name: "Enregistrer et notifier le client" })
    .click();
  await expect(page.locator(".timeline li")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: "Voir le détail" }).click();
  await expect(page.locator(".timeline")).toContainText(
    "Vérification navigateur",
  );
  await page.getByLabel("Nouveau statut").selectOption("CANCELLED");
  await page
    .getByRole("button", { name: "Enregistrer et notifier le client" })
    .click();
  await expect(page.locator(".timeline li")).toHaveCount(3);
  expect(errors).toEqual([]);
});
test("admin category/product CRUD, promotion and flexible editor", async ({
  page,
}) => {
  const unique = Date.now();
  const name = "Coffret navigateur " + unique;
  const category = "Collection navigateur " + unique;
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@indbox.local");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Indbox-Dev-2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Catégories", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une catégorie" }).click();
  await page.getByLabel("Nom", { exact: true }).fill(category);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Collection créée depuis le navigateur");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator("tbody")).toContainText(category);
  await page.getByRole("link", { name: "Produits", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un produit" }).click();
  await page.getByLabel("Nom du produit").fill(name);
  await page.getByLabel("Référence SKU").fill("BROWSER-" + unique);
  await page
    .getByLabel("Catégorie", { exact: true })
    .selectOption({ label: category });
  await page.getByRole("button", { name: "Images", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("assets/catalog/coffret.webp");
  await expect(page.locator(".image-editor-grid img")).toBeVisible();
  await page.getByRole("button", { name: "Tarification", exact: true }).click();
  await page.getByLabel("Prix de base (TND)").fill("50");
  await page.getByRole("button", { name: "Stock", exact: true }).click();
  await page.getByLabel("Stock du produit sans variantes").fill("20");
  await page.getByRole("button", { name: "Variantes", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une variante" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Format test");
  await page.getByLabel("SKU", { exact: true }).fill("BROWSER-V-" + unique);
  await page.getByLabel("Prix (TND)", { exact: true }).fill("50");
  await page.getByLabel("Stock", { exact: true }).fill("20");
  await page
    .getByRole("button", { name: "Spécifications", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter une caractéristique" })
    .click();
  await page.getByLabel("Caractéristique", { exact: true }).fill("Fermeture");
  await page.getByLabel("Valeur", { exact: true }).fill("Magnétique");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator("tbody")).toContainText(name);
  const slug = "coffret-navigateur-" + unique;
  await page.goto("/product/" + slug);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.locator("dl")).toContainText("Magnétique");
  await expect(page.locator(".detail-photo img")).toBeVisible();
  await page.goto("/admin/products?q=" + encodeURIComponent(name));
  await page.getByRole("button", { name: "Modifier " + name }).click();
  await page
    .getByLabel("Description courte")
    .fill("Modifié et visible publiquement");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("enregistrées");
  await page.goto("/product/" + slug);
  await expect(page.locator(".detail-copy")).toContainText(
    "Modifié et visible publiquement",
  );
  await page.goto("/admin/products?q=" + encodeURIComponent(name));
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByText("Aucun résultat pour le moment")).toBeVisible();
  await page.goto("/admin/categories?q=" + encodeURIComponent(category));
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByText("Aucun résultat pour le moment")).toBeVisible();
});
test("quote upload, contact form and responsive navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("link", { name: "Produits", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "packaging",
  );
  await page.goto("/quote");
  await page.getByLabel("Nom complet").fill("Browser Quote");
  await page.getByLabel("Téléphone", { exact: true }).fill("+21622000000");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Type de packaging").fill("Coffret cosmétique");
  await page.getByLabel("Quantité souhaitée").fill("500");
  await page
    .locator("input[type=file]")
    .setInputFiles("assets/catalog/cosmetic.webp");
  await expect(page.getByText("Pièce jointe 1")).toBeVisible();
  await page
    .getByRole("button", { name: "Envoyer ma demande de devis" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Votre demande a bien été reçue." }),
  ).toBeVisible();
  await page.goto("/contact");
  await page.getByLabel("Nom", { exact: true }).fill("Browser Contact");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Sujet").fill("Question navigateur");
  await page
    .getByLabel("Votre message")
    .fill("Bonjour, ceci est une vérification du formulaire de contact.");
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(
    page.getByRole("heading", { name: "Message bien reçu." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("admin promotions, coupons, email preview and all management sections", async ({
  page,
}) => {
  const unique = Date.now(),
    promoName = "Promotion navigateur " + unique,
    code = "BROWSER" + unique;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@indbox.local");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Indbox-Dev-2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(
    page.getByRole("heading", { name: "Vue d’ensemble" }),
  ).toBeVisible();
  await page.goto("/admin/promotions");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByLabel("Nom de la promotion").fill(promoName);
  await page.getByLabel("Type de remise").selectOption("FIXED");
  await page.getByLabel("Remise (TND)").fill("2");
  await page
    .getByRole("checkbox", { name: "Doypack noir", exact: true })
    .check();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator("tbody")).toContainText(promoName);
  await page.goto("/product/doypack-noir");
  await expect(page.locator(".detail-price strong")).toContainText("25,000");
  await expect(page.locator(".detail-price del")).toContainText("27,000");
  await page.goto("/admin/coupons");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByLabel("Code coupon").fill(code);
  await page.getByLabel("Remise (%)").fill("10");
  await page.getByLabel("Montant minimum").fill("0");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator("tbody")).toContainText(code);
  await page.goto("/product/doypack-noir");
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByRole("status")).toContainText("Produit ajouté");
  await page.goto("/cart");
  await page.getByLabel("Un code promo ?").fill(code);
  await page.getByRole("button", { name: "Appliquer le coupon" }).click();
  await expect(page.locator(".grand-total")).toContainText("22,500");
  await page.getByRole("button", { name: "Vider le panier" }).click();
  await expect(
    page.getByText("Votre prochaine création commence ici."),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page.goto("/admin/coupons?q=" + code);
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByText("Aucun résultat pour le moment")).toBeVisible();
  await page.goto("/admin/promotions?q=" + encodeURIComponent(promoName));
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByText("Aucun résultat pour le moment")).toBeVisible();
  for (const section of [
    "customers",
    "quotes",
    "messages",
    "services",
    "settings",
    "users",
    "notifications",
  ]) {
    await page.goto("/admin/" + section);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".notice.error")).toHaveCount(0);
  }
  const preview = page.getByRole("button", { name: "Aperçu", exact: true });
  if (await preview.count()) {
    await preview.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("iframe")).toBeVisible();
    await page.screenshot({
      path: "test-results/email-preview.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/products");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("customer registration, profile and private order history", async ({
  page,
}) => {
  const accountEmail = "account-browser-" + Date.now() + "@example.com";
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Nouveau ici ? Créer un compte" })
    .click();
  await page.getByLabel("Prénom", { exact: true }).fill("Client");
  await page.getByLabel("Nom", { exact: true }).fill("Navigateur");
  await page.getByLabel("Téléphone", { exact: true }).fill("+21622123456");
  await page.getByLabel("Email", { exact: true }).fill(accountEmail);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Customer-Verification-2026!");
  await page
    .getByRole("button", { name: "Créer mon compte", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Client Navigateur." }),
  ).toBeVisible();
  await expect(page.getByLabel("Téléphone", { exact: true })).toHaveValue(
    "+21622123456",
  );
  await page.getByLabel("Nom", { exact: true }).fill("Client Vérifié");
  await page.getByLabel("Entreprise", { exact: true }).fill("Atelier Test");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Client Vérifié." }),
  ).toBeVisible();
  await page.goto("/product/coffret-rigide-noir-premium");
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByRole("status")).toContainText("Produit ajouté");
  await page.goto("/checkout");
  await page.getByLabel("Prénom", { exact: true }).fill("Client");
  await page.getByLabel("Nom", { exact: true }).fill("Vérifié");
  await page.getByLabel("Téléphone", { exact: true }).fill("+21622123456");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    accountEmail,
  );
  await page.getByLabel("Adresse de livraison").fill("12 rue des Clients");
  await page.getByLabel("Ville", { exact: true }).fill("Tunis");
  await page.getByRole("button", { name: "Confirmer ma commande" }).click();
  await expect(
    page.getByRole("heading", { name: "Votre commande est enregistrée." }),
  ).toBeVisible();
  const reference = await page.locator(".confirmation>p strong").innerText();
  await page.goto("/account");
  await expect(page.locator(".order-accordion")).toHaveCount(1);
  await page.locator(".order-accordion summary").click();
  await expect(page.locator(".timeline")).toContainText("Nouveau");
  await expect(page.locator(".order-accordion")).toContainText(reference);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.getByLabel("Email", { exact: true }).fill(accountEmail);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Customer-Verification-2026!");
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(page.getByLabel("Entreprise", { exact: true })).toHaveValue(
    "Atelier Test",
  );
  await expect(page.locator(".order-accordion")).toContainText(reference);
  // Cancel our fixture through the API so a repeatable browser test never consumes stock.
  const auth = await page.request.post("/api/auth/login", {
    data: { email: "admin@indbox.local", password: "Indbox-Dev-2026!" },
  });
  expect(auth.ok()).toBe(true);
  const list = await (
    await page.request.get("/api/admin/orders?q=" + reference)
  ).json();
  const cancel = await page.request.patch(
    "/api/admin/orders/" + list.data[0].id + "/status",
    {
      data: { status: "CANCELLED", note: "Nettoyage du test de compte client" },
    },
  );
  expect(cancel.ok()).toBe(true);
});

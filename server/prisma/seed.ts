import "dotenv/config";
import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ADMIN_PASSWORD)
    throw new Error("SEED_ADMIN_PASSWORD required in production");
  await db.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || "admin@indbox.local" },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL || "admin@indbox.local",
      passwordHash: await bcrypt.hash(
        process.env.SEED_ADMIN_PASSWORD || "Indbox-Dev-2026!",
        12,
      ),
      name: "Admin IN-D-BOX",
      role: "ADMIN",
    },
  });
  const categories = [
    [
      "Coffrets de luxe",
      "coffret",
      "Des coffrets d’exception pour des instants mémorables.",
    ],
    [
      "Boîtes personnalisées",
      "coffret",
      "Une boîte pensée pour votre produit et votre marque.",
    ],
    [
      "Sacs shopping",
      "shopping",
      "Votre signature, jusque dans les moindres détails.",
    ],
    ["Sacs Kraft", "kraft", "La simplicité naturelle, une finition soignée."],
    [
      "Autocollants & étiquettes",
      "stickers",
      "Le détail qui signe votre identité.",
    ],
    [
      "Packaging alimentaire",
      "food",
      "Des emballages pratiques pour vos créations gourmandes.",
    ],
    [
      "Packaging cosmétique",
      "cosmetic",
      "Un écrin à la hauteur de vos produits.",
    ],
  ];
  const cats = [];
  for (const [i, [name, img, description]] of categories.entries())
    cats.push(
      await db.category.upsert({
        where: { slug: slug(name) },
        update: {},
        create: {
          name,
          slug: slug(name),
          description,
          image: `/assets/catalog/${img}.webp`,
          featured: true,
          displayOrder: i,
          seoTitle: `${name} | IN-D-BOX`,
          seoDescription: description,
        },
      }),
    );
  const products = [
    [
      "Coffret rigide noir premium",
      0,
      45,
      "coffret",
      "Carton rigide 2 mm",
      "25 × 20 × 10 cm",
    ],
    [
      "Coffret cadeau magnétique",
      0,
      38,
      "coffret",
      "Carton contrecollé",
      "22 × 18 × 8 cm",
    ],
    [
      "Sac shopping blanc personnalisé",
      2,
      32,
      "shopping",
      "Papier couché 250 g",
      "26 × 12 × 32 cm",
    ],
    ["Sac Kraft naturel", 3, 18, "kraft", "Kraft 120 g", "22 × 10 × 28 cm"],
    [
      "Boîte alimentaire personnalisée",
      5,
      29,
      "food",
      "Carton alimentaire",
      "20 × 15 × 7 cm",
    ],
    [
      "Boîte pâtisserie avec fenêtre",
      5,
      35,
      "food",
      "Carton blanc 300 g",
      "24 × 24 × 10 cm",
    ],
    [
      "Étiquettes autocollantes personnalisées",
      4,
      25,
      "stickers",
      "Papier adhésif mat",
      "Diamètre 5 cm",
    ],
    [
      "Coffret cosmétique premium",
      6,
      55,
      "cosmetic",
      "Carton rigide et insert",
      "20 × 16 × 6 cm",
    ],
    [
      "Boîte burger personnalisée",
      5,
      22,
      "food",
      "Kraft alimentaire",
      "12 × 12 × 9 cm",
    ],
    [
      "Doypack noir",
      1,
      27,
      "pouch",
      "Complexe barrière 130 microns",
      "10 × 15 cm",
    ],
    ["Packaging parfum", 6, 42, "cosmetic", "Carton 350 g", "8 × 8 × 15 cm"],
    [
      "Coffret produit premium",
      1,
      49,
      "coffret",
      "Carton rigide 2 mm",
      "30 × 20 × 12 cm",
    ],
    [
      "Sac Kraft grand format",
      3,
      24,
      "kraft",
      "Kraft renforcé 150 g",
      "32 × 17 × 42 cm",
    ],
    [
      "Pochette produit personnalisée",
      1,
      30,
      "pouch",
      "Kraft avec fenêtre",
      "12 × 20 cm",
    ],
  ] as const;
  const all = [];
  for (const [
    i,
    [name, category, price, img, material, dimensions],
  ] of products.entries()) {
    const p = await db.product.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        sku: `INDB-${String(i + 1).padStart(3, "0")}`,
        categoryId: cats[category].id,
        price,
        shortDescription: `${name} : une présentation soignée, une finition impeccable. Personnalisation sur devis.`,
        description: `Conçu pour valoriser votre marque, ce ${name.toLowerCase()} associe une fabrication soignée à un usage pratique. Disponible en plusieurs formats, avec personnalisation de l’impression et des finitions sur demande. Les visuels sont des illustrations de présentation ; le bon à tirer est validé avant toute fabrication personnalisée.`,
        featured: i < 8,
        isNew: i >= 8,
        stock: 80,
        orderUnit: i === 0 || i === 1 || i === 7 || i === 11 ? "UNIT" : "LOT",
        quantityPerLot: i === 0 || i === 1 || i === 7 || i === 11 ? 1 : 50,
        tags: ["packaging", "personnalise", slug(material)],
        specifications: {
          Matière: material,
          Dimensions: dimensions,
          Finition: "Mate",
          Personnalisation: "Impression et dorure sur devis",
        },
        seoTitle: `${name} | IN-D-BOX`,
        seoDescription: `Découvrez notre ${name.toLowerCase()} et choisissez votre format. Livraison en Tunisie.`,
        images: {
          create: [
            { url: `/assets/catalog/${img}.webp`, alt: name, displayOrder: 0 },
          ],
        },
        variants: {
          create: [
            {
              name: i === 9 ? "10 × 15 cm — 130 microns" : "Format standard",
              sku: `INDB-${i + 1}-S`,
              price,
              stock: i === 10 ? 8 : 120,
              dimensions,
              material,
              color:
                i === 2
                  ? "Blanc"
                  : i === 3 || i === 12
                    ? "Kraft naturel"
                    : "Noir",
              quantityPerLot:
                i === 0 || i === 1 || i === 7 || i === 11 ? 1 : 50,
            },
            {
              name: i === 9 ? "12 × 20 cm — 130 microns" : "Grand format",
              sku: `INDB-${i + 1}-L`,
              price: i === 9 ? 35 : price + 12,
              stock: 60,
              dimensions: i === 9 ? "12 × 20 cm" : "30 × 25 × 12 cm",
              material,
              quantityPerLot:
                i === 0 || i === 1 || i === 7 || i === 11 ? 1 : 50,
            },
            ...(i === 9
              ? [
                  {
                    name: "15 × 22 cm — 140 microns",
                    sku: "INDB-10-XL",
                    price: 40,
                    stock: 45,
                    dimensions: "15 × 22 cm",
                    material: "Complexe barrière 140 microns",
                    quantityPerLot: 50,
                  },
                ]
              : []),
          ],
        },
      },
    });
    all.push(p);
  }
  for (const [i, p] of all.entries()) {
    const related = all
      .filter((x) => x.categoryId === p.categoryId && x.id !== p.id)
      .slice(0, 3);
    await db.product.update({
      where: { id: p.id },
      data: { related: { connect: related.map((x) => ({ id: x.id })) } },
    });
  }
  const start = new Date(Date.now() - 86400000);
  const end = new Date(Date.now() + 365 * 86400000);
  for (const [code, type, value] of [
    ["WELCOME10", "PERCENTAGE", 10],
    ["BOX25", "FIXED", 25],
    ["RAMADAN20", "PERCENTAGE", 20],
  ] as const)
    await db.coupon.upsert({
      where: { code },
      update: {},
      create: {
        code,
        type,
        value,
        startsAt: start,
        endsAt: end,
        minimumOrder: code === "BOX25" ? 150 : 50,
        usageLimit: 500,
        perCustomerLimit: 3,
      },
    });
  if (!(await db.promotion.count()))
    await db.promotion.create({
      data: {
        name: "La sélection signature — 15 %",
        type: "PERCENTAGE",
        value: 15,
        startsAt: start,
        endsAt: end,
        categories: { connect: { id: cats[0].id } },
      },
    });
  const services = [
    [
      "Packaging personnalisé",
      "Du premier croquis à la dernière finition, un emballage fidèle à votre marque.",
      "coffret",
    ],
    [
      "Impression & finitions",
      "Dorure, impression et finitions : donnez du caractère à vos emballages.",
      "stickers",
    ],
    [
      "Conception graphique",
      "Une identité visuelle cohérente, conçue pour se démarquer.",
      "cosmetic",
    ],
    [
      "Coffrets de luxe",
      "Des matériaux sélectionnés et un souci du détail à chaque étape.",
      "coffret",
    ],
    [
      "Sacs personnalisés",
      "Des sacs qui prolongent l’expérience de votre boutique.",
      "shopping",
    ],
    [
      "Étiquettes & autocollants",
      "La touche finale pour personnaliser chaque produit.",
      "stickers",
    ],
  ];
  for (const [i, [title, description, img]] of services.entries())
    if (!(await db.service.findFirst({ where: { title } })))
      await db.service.create({
        data: {
          title,
          description,
          image: `/assets/catalog/${img}.webp`,
          displayOrder: i,
        },
      });
  await db.siteSetting.upsert({
    where: { key: "site" },
    update: {},
    create: {
      key: "site",
      value: {
        phone: "+216 71 000 000",
        email: "contact@indbox.tn",
        address: "Tunis, Tunisie",
        instagram: "",
        facebook: "",
        heroTitle: "Votre produit mérite un packaging d’exception.",
        heroSubtitle:
          "Coffrets, sacs et emballages personnalisés. Nous donnons forme à votre identité, jusque dans les moindres détails.",
        heroCta: "Explorer la collection",
        heroBackground: "/assets/bckgimg.png",
        companyDescription:
          "Chez IN-D-BOX, nous croyons que la première impression commence avant l’ouverture. Nous imaginons des emballages qui protègent vos produits et racontent votre marque. Du petit commerce aux grandes collections, chaque projet reçoit la même attention.",
        footerText:
          "Des emballages qui protègent. Une identité qui se démarque.",
      },
    },
  });
  for (const [i, status] of (
    ["NEW", "CONFIRMED", "IN_PREPARATION", "DELIVERED"] as OrderStatus[]
  ).entries()) {
    const email = `client${i + 1}@example.com`;
    const c = await db.customer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName: ["Amira", "Youssef", "Nour", "Sami"][i],
        lastName: ["Ben Ali", "Mansour", "Trabelsi", "Ben Salem"][i],
        phone: `+216 20 000 00${i}`,
        company: ["Maison Amira", "Café Atelier", "Nour Cosmetics", "Studio S"][
          i
        ],
        addresses: {
          create: { street: "12 avenue de la Création", city: "Tunis" },
        },
      },
    });
    const key = `seed-order-${i}`;
    if (!(await db.order.findUnique({ where: { idempotencyKey: key } }))) {
      const p = all[i];
      const v = await db.productVariant.findFirstOrThrow({
        where: { productId: p.id },
        orderBy: { sku: "asc" },
      });
      const total = Number(v.price) * 3;
      const o = await db.order.create({
        data: {
          idempotencyKey: key,
          number: `seed-pending-${i}`,
          customerId: c.id,
          status,
          firstName: c.firstName,
          lastName: c.lastName,
          email,
          phone: c.phone,
          address: "12 avenue de la Création",
          city: "Tunis",
          company: c.company,
          subtotal: total,
          promotionDiscount: 0,
          couponDiscount: 0,
          total,
          notes: "Commande de démonstration.",
          items: {
            create: {
              productId: p.id,
              variantId: v.id,
              productName: p.name,
              variantName: v.name,
              sku: v.sku,
              image: `/assets/catalog/${products[i][3]}.webp`,
              quantity: 3,
              orderUnit: p.orderUnit,
              quantityPerLot: v.quantityPerLot,
              regularPrice: v.price,
              unitPrice: v.price,
              total,
            },
          },
          history: {
            create: [
              {
                status: "NEW",
                actor: "Démonstration",
                note: "Commande de démonstration",
              },
              ...(status !== "NEW"
                ? [
                    {
                      status,
                      actor: "Admin IN-D-BOX",
                      note: "Exemple de suivi",
                    },
                  ]
                : []),
            ],
          },
        },
      });
      await db.order.update({
        where: { id: o.id },
        data: {
          number: `INDB-${new Date().getFullYear()}-${String(o.sequence).padStart(6, "0")}`,
        },
      });
    }
  }
  if (!(await db.quoteRequest.count()))
    for (const [i, name] of ["Atelier Jasmin", "Maison Oliva"].entries()) {
      const q = await db.quoteRequest.create({
        data: {
          number: `seed-quote-${i}`,
          name,
          company: name,
          email: `devis${i + 1}@example.com`,
          phone: "+216 22 000 000",
          status: i ? "REVIEWING" : "NEW",
          notes: "Personnalisation avec notre identité visuelle et dorure.",
          files: [],
          items: {
            create: {
              packagingType: "Coffret personnalisé",
              quantity: 500,
              dimensions: "25 × 20 × 10 cm",
              material: "Carton rigide",
              printing: "Dorure à chaud",
              colors: "Noir et or",
              categoryId: cats[0].id,
            },
          },
        },
      });
      await db.quoteRequest.update({
        where: { id: q.id },
        data: {
          number: `DEV-${new Date().getFullYear()}-${String(q.sequence).padStart(5, "0")}`,
        },
      });
    }
  if (!(await db.contactMessage.count()))
    await db.contactMessage.create({
      data: {
        name: "Le Comptoir",
        email: "comptoir@example.com",
        subject: "Personnalisation de sacs",
        message:
          "Bonjour, nous souhaitons découvrir vos finitions pour une collection de sacs shopping.",
      },
    });
  console.log(
    `Seed complete: ${await db.category.count()} categories, ${await db.product.count()} products. Development admin: ${process.env.SEED_ADMIN_EMAIL || "admin@indbox.local"}`,
  );
}
main().finally(() => db.$disconnect());

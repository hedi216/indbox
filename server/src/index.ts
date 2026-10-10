import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env, root, uploadRoot } from "./config.js";
import { db } from "./db.js";
import { auth, optionalAuth, requireRole } from "./auth.js";
import { publicApi } from "./public.js";
import { admin } from "./admin.js";
import { uploads } from "./uploads.js";
import { errorHandler, ok, HttpError } from "./http.js";
import { startMailWorker } from "./mail.js";
startMailWorker();
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "blob:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"],
        "connect-src": ["'self'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(cors({ origin: env.CLIENT_ORIGIN.split(","), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
// Cookie authentication requires a same-origin request or an explicitly allowed frontend origin.
app.use("/api", (req, _res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    if (
      origin &&
      !env.CLIENT_ORIGIN.split(",").includes(origin) &&
      origin !== env.PUBLIC_URL
    )
      return next(new HttpError(403, "Origine non autorisée."));
    if (req.headers["sec-fetch-site"] === "cross-site" && !origin)
      return next(new HttpError(403, "Requête non autorisée."));
  }
  next();
});
app.use(optionalAuth);
app.use("/api", (req, _res, next) => {
  const allowed =
    (req.method === "GET" && req.path === "/auth/me") ||
    (req.method === "POST" &&
      ["/auth/login", "/auth/logout", "/auth/change-password"].includes(
        req.path,
      ));
  if (req.user?.mustChangePassword && !allowed)
    return next(
      new HttpError(
        403,
        "Vous devez changer votre mot de passe avant de continuer.",
      ),
    );
  next();
});
app.use("/assets", express.static(path.join(root, "assets"), { maxAge: "1d" }));
app.use(
  "/uploads/quotes",
  requireRole("ADMIN", "MANAGER"),
  (_req, res, next) => {
    res.setHeader("Content-Disposition", "attachment");
    next();
  },
  express.static(path.join(uploadRoot, "quotes")),
);
for (const folder of ["products", "categories", "site"])
  app.use(
    `/uploads/${folder}`,
    express.static(path.join(uploadRoot, folder), { maxAge: "1d" }),
  );
app.get("/api/health", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  ok(res, { status: "ok", database: "postgresql" });
});
app.use("/api/auth", auth);
app.use("/api/uploads", uploads);
app.use("/api/admin", admin);
app.use("/api", publicApi);
app.get("/sitemap.xml", async (_req, res) => {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { active: true, category: { active: true } },
      select: { slug: true },
    }),
    db.category.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  const urls = [
    "/",
    "/products",
    "/categories",
    "/services",
    "/about",
    "/contact",
    "/quote",
    ...products.map((p) => `/product/${p.slug}`),
    ...categories.map((c) => `/category/${c.slug}`),
  ];
  const escape = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  res
    .type("xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${escape(env.PUBLIC_URL + u)}</loc></url>`).join("")}</urlset>`,
    );
});
app.use("/api", (_req, _res, next) =>
  next(new HttpError(404, "Route introuvable.")),
);
if (env.NODE_ENV === "production") {
  app.use(express.static(path.join(root, "client/dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "client/dist/index.html")),
  );
}
app.use(errorHandler);
const server = app.listen(env.PORT, "127.0.0.1", () =>
  console.log(`IN-D-BOX API http://127.0.0.1:${env.PORT}`),
);
async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

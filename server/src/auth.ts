import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { db } from "./db.js";
import { env } from "./config.js";
import { ok, HttpError } from "./http.js";
import type { Role } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; name: string; email: string };
    }
  }
}
const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
};
export const auth = Router();
export const limited = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  // Keep login, checkout, contact and upload quotas independent for a shared IP.
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip || "127.0.0.1")}:${req.baseUrl}:${req.route?.path || req.path}`,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { message: "Trop de tentatives. Réessayez plus tard." } },
});
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies.access_token ||
      req.headers.authorization?.replace(/^Bearer /, "");
    if (token) {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "indbox",
        audience: "indbox",
      }) as { sub: string; version: number };
      const user = await db.user.findUnique({ where: { id: payload.sub } });
      if (user?.active && user.tokenVersion === payload.version)
        req.user = {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        };
    }
  } catch {}
  next();
}
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user)
      return next(new HttpError(401, "Connectez-vous pour continuer."));
    if (roles.length && !roles.includes(req.user.role))
      return next(new HttpError(403, "Accès non autorisé."));
    next();
  };
}
function session(res: Response, user: { id: string; tokenVersion: number }) {
  const token = jwt.sign({ version: user.tokenVersion }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "8h",
    issuer: "indbox",
    audience: "indbox",
  });
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 3600000,
    path: "/",
  });
}
auth.post("/login", limited, async (req, res) => {
  const body = z
    .object({
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
      password: z.string().max(72),
    })
    .parse(req.body);
  const user = await db.user.findUnique({ where: { email: body.email } });
  if (
    !user?.active ||
    !(await bcrypt.compare(body.password, user.passwordHash))
  )
    throw new HttpError(401, "Email ou mot de passe incorrect.");
  session(res, user);
  ok(
    res,
    await db.user.findUnique({
      where: { id: user.id },
      select: { ...safeUser, customer: true },
    }),
  );
});
auth.post("/register", limited, async (req, res) => {
  const b = z
    .object({
      firstName: z.string().min(1).max(80),
      lastName: z.string().min(1).max(80),
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase()),
      password: z.string().min(12).max(72),
      phone: z.string().min(6).max(30),
    })
    .parse(req.body);
  const hash = await bcrypt.hash(b.password, 12);
  const user = await db.user.create({
    data: {
      name: `${b.firstName} ${b.lastName}`,
      email: b.email,
      passwordHash: hash,
      customer: {
        create: {
          firstName: b.firstName,
          lastName: b.lastName,
          email: b.email,
          phone: b.phone,
        },
      },
    },
  });
  session(res, user);
  ok(
    res,
    await db.user.findUnique({
      where: { id: user.id },
      select: { ...safeUser, customer: true },
    }),
    201,
  );
});
auth.get("/me", requireRole(), async (req, res) =>
  ok(
    res,
    await db.user.findUnique({
      where: { id: req.user!.id },
      select: { ...safeUser, customer: true },
    }),
  ),
);
auth.patch("/me", requireRole(), async (req, res) => {
  const b = z
    .object({
      name: z.string().min(2).max(160),
      phone: z.string().min(6).max(30).optional(),
      company: z.string().max(160).optional(),
    })
    .parse(req.body);
  await db.user.update({ where: { id: req.user!.id }, data: { name: b.name } });
  if (b.phone)
    await db.customer.updateMany({
      where: { userId: req.user!.id },
      data: { phone: b.phone, company: b.company },
    });
  ok(res, { saved: true });
});
auth.post("/logout", async (req, res) => {
  if (req.user)
    await db.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });
  res.clearCookie("access_token", { path: "/" });
  ok(res, { loggedOut: true });
});
export function cartId(req: Request, res: Response) {
  let id = req.cookies.cart_id;
  if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) {
    id = randomBytes(32).toString("hex");
    res.cookie("cart_id", id, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 86400000,
      path: "/",
    });
  }
  return createHash("sha256").update(id).digest("hex");
}

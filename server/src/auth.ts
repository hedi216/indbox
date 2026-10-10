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
import { db, transaction } from "./db.js";
import {
  passwordSchema,
  issueToken,
  hashToken,
  invalidateSecurity,
} from "./security.js";
import { securityEmail } from "./mail.js";
import { env } from "./config.js";
import { ok, HttpError } from "./http.js";
import type { Role } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        name: string;
        email: string;
        mustChangePassword: boolean;
      };
    }
  }
}
const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  mustChangePassword: true,
  emailVerified: true,
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
          mustChangePassword: user.mustChangePassword,
        };
    }
  } catch {}
  next();
}
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user)
      return next(new HttpError(401, "Connectez-vous pour continuer."));
    if (req.user.mustChangePassword)
      return next(
        new HttpError(
          403,
          "Vous devez changer votre mot de passe avant de continuer.",
        ),
      );
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
function identity(req: Request, _res: Response, next: NextFunction) {
  if (!req.user)
    return next(new HttpError(401, "Connectez-vous pour continuer."));
  next();
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
    (user.mustChangePassword &&
      (!user.temporaryPasswordExpiresAt ||
        user.temporaryPasswordExpiresAt <= new Date())) ||
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
      password: passwordSchema,
      phone: z.string().min(6).max(30),
    })
    .parse(req.body);
  const hash = await bcrypt.hash(b.password, 12);
  const user = await transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { email: b.email },
    });
    const user = await tx.user.create({
      data: {
        name: `${b.firstName} ${b.lastName}`,
        email: b.email,
        passwordHash: hash,
        ...(!customer
          ? {
              customer: {
                create: {
                  firstName: b.firstName,
                  lastName: b.lastName,
                  email: b.email,
                  phone: b.phone,
                },
              },
            }
          : {}),
      },
    });
    await issueToken(tx, user, "VERIFY");
    return user;
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
auth.get("/me", identity, async (req, res) =>
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

const emailSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
});
const genericMessage = "Si ce compte est éligible, un email vous sera envoyé.";
for (const [route, purpose] of [
  ["/forgot-password", "RESET"],
  ["/resend-verification", "VERIFY"],
] as const) {
  auth.post(route, limited, async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    await transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (
        !user?.active ||
        user.mustChangePassword ||
        (purpose === "VERIFY" && user.emailVerified)
      )
        return;
      // Per-account cooldown complements per-IP rate limiting, without revealing existence.
      const recent = await tx.userSecurityToken.findFirst({
        where: {
          userId: user.id,
          purpose,
          createdAt: { gt: new Date(Date.now() - 60000) },
        },
      });
      if (!recent) await issueToken(tx, user, purpose);
    });
    ok(res, { message: genericMessage });
  });
}
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
auth.post("/verify-email", limited, async (req, res) => {
  const { token } = z.object({ token: tokenSchema }).parse(req.body);
  await transaction(async (tx) => {
    const record = await tx.userSecurityToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (
      !record ||
      record.purpose !== "VERIFY" ||
      record.usedAt ||
      record.expiresAt <= new Date() ||
      !record.user.active
    )
      throw new HttpError(400, "Lien invalide ou expiré.");
    await tx.userSecurityToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    const user = await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });
    // Only verified ownership may claim an existing guest customer record.
    if (user.role === "CUSTOMER")
      await tx.customer.updateMany({
        where: { email: user.email, userId: null },
        data: { userId: user.id },
      });
    await securityEmail(tx, user, "VERIFIED", record.id);
  });
  ok(res, { message: "Votre email est vérifié. Bienvenue chez IN-D-BOX !" });
});
auth.post("/reset-password", limited, async (req, res) => {
  const { token, password } = z
    .object({ token: tokenSchema, password: passwordSchema })
    .parse(req.body);
  const hash = await bcrypt.hash(password, 12);
  await transaction(async (tx) => {
    const record = await tx.userSecurityToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (
      !record ||
      record.purpose !== "RESET" ||
      record.usedAt ||
      record.expiresAt <= new Date() ||
      !record.user.active ||
      record.user.mustChangePassword
    )
      throw new HttpError(400, "Lien invalide ou expiré.");
    await invalidateSecurity(tx, record.userId);
    const user = await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash, tokenVersion: { increment: 1 } },
    });
    await securityEmail(
      tx,
      user,
      "PASSWORD_CHANGED",
      String(user.tokenVersion),
    );
  });
  res.clearCookie("access_token", { path: "/" });
  ok(res, { message: "Mot de passe modifié. Reconnectez-vous." });
});
auth.post("/change-password", identity, limited, async (req, res) => {
  const { currentPassword, password } = z
    .object({ currentPassword: z.string().max(72), password: passwordSchema })
    .parse(req.body);
  await transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: req.user!.id },
    });
    if (
      !user.active ||
      !(await bcrypt.compare(currentPassword, user.passwordHash)) ||
      (user.mustChangePassword &&
        (!user.temporaryPasswordExpiresAt ||
          user.temporaryPasswordExpiresAt <= new Date()))
    )
      throw new HttpError(
        400,
        "Mot de passe actuel invalide ou temporaire expiré.",
      );
    if (await bcrypt.compare(password, user.passwordHash))
      throw new HttpError(422, "Choisissez un mot de passe différent.");
    await invalidateSecurity(tx, user.id);
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: false,
        temporaryPasswordExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });
    await securityEmail(
      tx,
      updated,
      "PASSWORD_CHANGED",
      String(updated.tokenVersion),
    );
  });
  res.clearCookie("access_token", { path: "/" });
  ok(res, { message: "Mot de passe modifié. Reconnectez-vous." });
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

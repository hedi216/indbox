import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma, User } from "@prisma/client";
import { validPassword } from "./password-policy.js";
import { securityEmail } from "./mail.js";
export const passwordSchema = z
  .string()
  .max(72)
  .refine(
    validPassword,
    "12 caractères minimum, majuscule, minuscule, chiffre et caractère spécial ; 72 octets maximum.",
  );
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function invalidateSecurity(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.userSecurityToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  await tx.emailNotification.updateMany({
    where: {
      reference: userId,
      sensitive: true,
      status: { in: ["PENDING", "RETRY"] },
    },
    data: { status: "CANCELLED" },
  });
}
export async function issueToken(
  tx: Prisma.TransactionClient,
  user: User,
  purpose: "VERIFY" | "RESET",
) {
  const now = new Date();
  await tx.userSecurityToken.updateMany({
    where: { userId: user.id, purpose, usedAt: null },
    data: { usedAt: now },
  });
  await tx.emailNotification.updateMany({
    where: {
      reference: user.id,
      event: { startsWith: `SECURITY_${purpose}_` },
      status: { in: ["PENDING", "RETRY"] },
    },
    data: { status: "CANCELLED" },
  });
  const raw = randomBytes(32).toString("hex");
  const token = await tx.userSecurityToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      purpose,
      expiresAt: new Date(
        Date.now() + (purpose === "VERIFY" ? 24 : 1) * 3600000,
      ),
    },
  });
  await securityEmail(tx, user, purpose, token.id, {
    token: raw,
    expiresAt: token.expiresAt,
  });
}
export async function temporaryCredentials(
  tx: Prisma.TransactionClient,
  user: User,
) {
  const password = `Aa1!${randomBytes(24).toString("base64url")}`;
  await invalidateSecurity(tx, user.id);
  const updated = await tx.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 86400000),
      tokenVersion: { increment: 1 },
    },
  });
  await securityEmail(tx, updated, "INVITE", String(updated.tokenVersion), {
    password,
    expiresAt: updated.temporaryPasswordExpiresAt!,
  });
  return updated;
}

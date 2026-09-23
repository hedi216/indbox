import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function ok(res: Response, data: unknown, status = 200, meta?: unknown) {
  return res.status(status).json({ data, ...(meta ? { meta } : {}) });
}
export function errorHandler(
  e: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (e instanceof ZodError)
    return res.status(422).json({
      error: {
        message: "Veuillez vérifier les champs.",
        fields: e.flatten(),
      },
    });
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002")
      return res.status(409).json({
        error: {
          message: "Cette valeur existe déjà (email, référence ou slug).",
        },
      });
    if (e.code === "P2003")
      return res.status(409).json({
        error: {
          message:
            "Cet élément est lié à des données existantes. Désactivez-le ou retirez les liens.",
        },
      });
    if (e.code === "P2025")
      return res
        .status(404)
        .json({ error: { message: "Élément introuvable." } });
  }
  const status =
    e.status ||
    (e.code === "LIMIT_FILE_SIZE" ? 413 : e.name === "MulterError" ? 422 : 500);
  if (status >= 500) console.error(e);
  res.status(status).json({
    error: {
      message:
        status >= 500 ? "Une erreur est survenue. Réessayez." : e.message,
    },
  });
}
export function page(query: Request["query"]) {
  const p = Math.max(1, Math.min(100000, Number(query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
  return { page: p, limit, skip: (p - 1) * limit };
}

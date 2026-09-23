import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadRoot } from "./config.js";
import { limited, requireRole } from "./auth.js";
import { HttpError, ok } from "./http.js";
export const uploads = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.mimetype,
      )
    )
      return cb(
        new HttpError(
          422,
          "Formats acceptés : JPEG, PNG, WebP et PDF (devis).",
        ),
      );
    cb(null, true);
  },
});
uploads.post(
  "/:folder",
  limited,
  (req, res, next) => {
    const folder = String(req.params.folder);
    if (!["products", "categories", "quotes", "site"].includes(folder))
      return next(new HttpError(404, "Dossier invalide."));
    if (folder === "quotes") return next();
    requireRole("ADMIN", "MANAGER")(req, res, next);
  },
  (req, res, next) => {
    if (
      req.user?.role === "MANAGER" &&
      ["categories", "site"].includes(String(req.params.folder))
    )
      return next(new HttpError(403, "Accès non autorisé."));
    next();
  },
  upload.array("files", 5),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) throw new HttpError(422, "Sélectionnez un fichier.");
    const folder = String(req.params.folder);
    const dir = path.join(uploadRoot, folder);
    await mkdir(dir, { recursive: true });
    const paths = [];
    for (const f of files) {
      const isPdf = f.mimetype === "application/pdf";
      if (isPdf && folder !== "quotes")
        throw new HttpError(422, "Les PDF sont réservés aux devis.");
      let buffer: Buffer;
      let ext: string;
      if (isPdf) {
        if (f.buffer.subarray(0, 5).toString() !== "%PDF-")
          throw new HttpError(422, "PDF invalide.");
        buffer = f.buffer;
        ext = "pdf";
      } else {
        try {
          buffer = await sharp(f.buffer, { limitInputPixels: 25000000 })
            .rotate()
            .resize({
              width: 1800,
              height: 1800,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();
        } catch {
          throw new HttpError(422, "Image invalide.");
        }
        ext = "webp";
      }
      const filename = `${randomUUID()}.${ext}`;
      await writeFile(path.join(dir, filename), buffer);
      paths.push(`/uploads/${folder}/${filename}`);
    }
    ok(res, paths, 201);
  },
);

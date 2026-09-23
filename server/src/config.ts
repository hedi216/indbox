import "dotenv/config";
import path from "node:path";
import { z } from "zod";
export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().default("http://localhost:5175"),
    PUBLIC_URL: z.string().url().default("http://localhost:5175"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    TRUST_PROXY: z.coerce.number().default(0),
  })
  .parse(process.env);
export const root = path.resolve(import.meta.dirname, "../..");
export const uploadRoot = path.join(root, "uploads");

// Runs migrations/seeds only against a newly created disposable local database.
import { mkdtemp, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { request } from "node:http";
import net from "node:net";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const root = process.cwd();
const dir = await mkdtemp(path.join(tmpdir(), "indbox-tests-"));
async function freePort() {
  const s = net.createServer();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
const pgPort = await freePort(),
  apiPort = await freePort(),
  webPort = await freePort();
const pg = (name) =>
  process.env.TEST_PG_BIN
    ? path.join(
        process.env.TEST_PG_BIN,
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://indbox_test@127.0.0.1:${pgPort}/indbox_test?schema=public`,
  JWT_SECRET: "isolated-test-secret-never-use-in-production",
  NODE_ENV: "test",
  PORT: String(apiPort),
  TEST_API_URL: `http://127.0.0.1:${apiPort}/api`,
  E2E_BASE_URL: `http://127.0.0.1:${webPort}`,
  CLIENT_ORIGIN: `http://127.0.0.1:${webPort}`,
  PUBLIC_URL: "https://indbox.tn",
  MAIL_DELIVERY_ENABLED: "false",
  MAIL_DELIVERY_NOT_BEFORE: "",
  SMTP_HOST: "",
  SMTP_USER: "",
  SMTP_PASS: "",
  ADMIN_NOTIFICATION_EMAIL: "",
  MAIL_REPLY_TO: "",
  LOW_STOCK_THRESHOLD: "5",
  SEED_ADMIN_EMAIL: "admin@indbox.local",
  SEED_ADMIN_PASSWORD: "Indbox-Dev-2026!",
};
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(command, args, { cwd: root, env, stdio: "inherit" });
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
const npm = (...args) =>
  run(process.execPath, [process.env.npm_execpath, ...args]);
let api,
  web,
  started = false;
async function startApi() {
  api = spawn(process.execPath, ["server/dist/index.js"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(env.TEST_API_URL + "/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Isolated API did not start");
}
async function stopApi() {
  if (api && api.exitCode === null) {
    const stopped = new Promise((r) => api.once("exit", r));
    api.kill();
    await stopped;
  }
}
try {
  await run(pg("initdb"), [
    "-D",
    path.join(dir, "db"),
    "-A",
    "trust",
    "-U",
    "indbox_test",
  ]);
  await run(pg("pg_ctl"), [
    "-D",
    path.join(dir, "db"),
    "-l",
    path.join(dir, "postgres.log"),
    "-o",
    `-p ${pgPort} -h 127.0.0.1`,
    "start",
  ]);
  started = true;
  await run(pg("createdb"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(pgPort),
    "-U",
    "indbox_test",
    "indbox_test",
  ]);
  await npm("run", "db:generate");
  // Exercise an upgrade from the real previous schema with an existing account/session.
  const baseline = path.join(dir, "baseline");
  await mkdir(path.join(baseline, "migrations"), { recursive: true });
  await cp(
    path.join(root, "server/prisma/schema.prisma"),
    path.join(baseline, "schema.prisma"),
  );
  await cp(
    path.join(root, "server/prisma/migrations/migration_lock.toml"),
    path.join(baseline, "migrations/migration_lock.toml"),
  );
  for (const migration of [
    "202609210001_initial",
    "202609220002_integrity",
    "202609220003_timezone",
  ])
    await cp(
      path.join(root, "server/prisma/migrations", migration),
      path.join(baseline, "migrations", migration),
      { recursive: true },
    );
  await npm(
    "exec",
    "-w",
    "server",
    "--",
    "prisma",
    "migrate",
    "deploy",
    "--schema",
    path.join(baseline, "schema.prisma"),
  );
  const legacyHash = await bcrypt.hash("legacy-password", 12);
  await run(pg("psql"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(pgPort),
    "-U",
    "indbox_test",
    "-d",
    "indbox_test",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `INSERT INTO "User" (id,email,"passwordHash",name,role,"tokenVersion","updatedAt") VALUES ('legacy-migration','legacy-migration@example.com','${legacyHash}','Legacy customer','CUSTOMER',7,NOW())`,
  ]);
  env.LEGACY_TEST_COOKIE = jwt.sign({ version: 7 }, env.JWT_SECRET, {
    subject: "legacy-migration",
    issuer: "indbox",
    audience: "indbox",
    expiresIn: "8h",
  });
  await npm("run", "db:migrate");
  await npm("exec", "-w", "server", "--", "prisma", "validate");
  await npm(
    "exec",
    "-w",
    "server",
    "--",
    "prisma",
    "migrate",
    "diff",
    "--from-url",
    env.DATABASE_URL,
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--exit-code",
  );
  await npm("run", "db:seed");
  env.NODE_ENV = "production";
  await npm("run", "build");
  env.NODE_ENV = "test";
  await startApi();
  await npm("test");
  await stopApi();
  await startApi(); // Fresh rate-limit counters for browser suite.
  const app = express();
  app.use(express.static(path.join(root, "client/dist")));
  app.use((req, res, next) => {
    if (!["/api", "/assets", "/uploads"].some((p) => req.url.startsWith(p)))
      return next();
    const upstream = request(
      `http://127.0.0.1:${apiPort}${req.url}`,
      { method: req.method, headers: req.headers },
      (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      },
    );
    upstream.on("error", () => res.status(502).end());
    req.pipe(upstream);
  });
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "client/dist/index.html")),
  );
  web = app.listen(webPort, "127.0.0.1");
  await npm("run", "test:e2e");
} finally {
  if (web) await new Promise((r) => web.close(r));
  await stopApi();
  if (started)
    await run(pg("pg_ctl"), ["-D", path.join(dir, "db"), "stop", "-m", "fast"]);
  console.log(
    `Isolated test files: ${dir}. No existing database or SMTP provider used.`,
  );
}

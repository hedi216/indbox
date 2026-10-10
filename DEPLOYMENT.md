# IN-D-BOX — manual production update

Production: https://indbox.tn. Existing Contabo Windows Server VM, Node.js, PostgreSQL, IN-D-BOX NSSM service, Cloudflare Tunnel and MailEnable Standard. **This document is a checklist, not evidence of deployment. No production migration, restart, SMTP activation or deployment has been performed.**

## Scope and compatibility

Authentication retains bcrypt hashes, HS256 JWTs, eight-hour sessions, `tokenVersion`, secure production cookies and account `active` flags. Preserve the current JWT secret and database. The additive migration marks existing accounts email-verified without rotating passwords or sessions. Existing passwords remain valid for login; the shared stronger policy applies when a password is created or changed.

New customer registrations receive a welcome/verification email and can continue using their account while verification is pending. Guest checkout is unchanged. An existing guest customer record can be associated with a new account only after successful email verification. New employee accounts receive a cryptographically generated temporary password, must change it before accessing protected operations, and expire after 24 hours. Only session inspection, login, logout and password change are allowed during that restriction. Administrators regenerate credentials using Users; they never choose the initial password.

Verification tokens last 24 hours; reset tokens last one hour. Tokens are random, stored as SHA-256 hashes and consumed within serializable transactions. Reset/resend requests return generic responses with per-IP limits and a per-account cooldown. Regeneration invalidates old credentials, tokens and sessions. Password/role/access changes also invalidate outstanding security tokens; ordinary logout revokes sessions but leaves email links usable until expiry. Password changes/reset invalidate all previous sessions and queue a confirmation. Recovery requests for temporary employee accounts require administrator regeneration. Security links use URL fragments to avoid HTTP access-log/referrer leakage and are consumed by explicit POST, not link-preview GETs.

Every customer/staff/security email uses `PUBLIC_URL`, the centralized HTML/text BizzRes signature and the existing outbox. Security emails expire in the outbox, cannot be manually retried and are redacted in admin previews. Their original queued bodies contain the requested temporary credentials or bearer links: restrict database/backups access accordingly; no secrets are returned in user API responses. Regeneration cancels pending older security mail without deleting history. In-flight mail already accepted by SMTP cannot be recalled, but replaced credentials/links are invalid.

Staff preferences default to off for existing and new users. An active ADMIN or MANAGER who has completed onboarding can opt into each event via Users: new orders, order status, new quotes, quote status, contact and low stock. The legacy `ADMIN_NOTIFICATION_EMAIL` remains a fallback; a matching staff account's active state/preferences take precedence. Recipients are deduplicated case-insensitively, including when the staff member is also the customer recipient. Customer order messages are status-specific; unchanged statuses create no new notification. Checkout idempotency, stock changes and notifications remain transactional.

Low-stock alerts fire on crossing from above `LOW_STOCK_THRESHOLD` (default 5 sale units) to at/below it, during checkout or admin product/variant edits. Initially created low-stock items also alert. Remaining below the threshold does not repeatedly alert; replenishment above it allows another crossing alert. Disabled or untracked products are excluded.

## Database migrations

**Required new migration: `202610090001_account_security`.** It adds user security fields/preferences, `UserSecurityToken`, sensitive/expiry metadata on the outbox and the `CANCELLED` email state. It preserves existing rows, hashes, sessions, orders and stock; existing users are grandfathered as verified. Test lock duration on a restored production copy before applying. All versioned migrations are:

- `202609210001_initial`
- `202609220002_integrity`
- `202609220003_timezone`
- **`202610090001_account_security` (new, required)**

On the VM, inspect `npx prisma migrate status --schema server/prisma/schema.prisma` using the existing deployment's environment loading. Prisma loads `server/.env`; existing process environment may override it. Confirm the database identity without printing credentials. Compare pending SQL with production schema and test against a restored staging copy before any application. Do not blindly apply an initial migration to an already populated untracked schema. If history disagrees, stop and reconcile it separately; do not reset, recreate, seed, or mark migrations applied without verifying the schema.

Only if reviewed pending migrations actually exist, an operator may run `npm run db:migrate` during the approved maintenance window. Never use `db:setup`, `db:seed`, `migrate reset`, `migrate dev` or `db push` against production.

## Environment changes (manual merge only)

Keep the current production `.env`, database URL, JWT secret, NODE_ENV, port, proxy settings and other secrets. Merge only these values into the environment source already used by the service; do not change NSSM configuration:

```ini
PUBLIC_URL=https://indbox.tn
CLIENT_ORIGIN=https://indbox.tn
MAIL_FROM="IN-D-BOX <no-reply@indbox.tn>"
MAIL_REPLY_TO=
MAIL_DELIVERY_ENABLED=false
MAIL_DELIVERY_NOT_BEFORE=
SMTP_HOST=127.0.0.1
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
LOW_STOCK_THRESHOLD=5
```

These are the operator-confirmed MailEnable values: SMTP listens exclusively on `127.0.0.1:25`, allows relay from the local server and needs no SMTP username/password. A real no-reply message was received in Gmail according to the operator; SPF/DKIM/DMARC records already exist. No server or DNS configuration was inspected or changed during this preparation. The plaintext SMTP exception applies only to the exact loopback endpoint; remote production relays still require TLS. The exact mandated `MAIL_FROM` is validated before delivery; stale or different senders block sending. Reply-To is optional and remains **unset**. Configure `contact@indbox.tn` only after reception or forwarding has actually been verified. No dedicated mailbox is required for `no-reply@indbox.tn`. Keep `ADMIN_NOTIFICATION_EMAIL` unset unless its intended recipient is confirmed.

Missing/false activation, missing/invalid cutoff, missing SMTP host, wrong sender or malformed Reply-To disables sending without disabling login or checkout. The cutoff requires a full UTC timestamp, such as the format `YYYY-MM-DDTHH:mm:ss.sssZ`; do not use a historical example value. It is persisted in configuration, not calculated afresh on startup.

## Manual Windows / NSSM deployment sequence

Perform this sequence manually on the VM from the existing IN-D-BOX checkout using the deployment account. Node.js 22.12+, npm 10+, PostgreSQL tools and the existing NSSM executable must be available. Use a maintenance window; if the installed Prisma engine is locked by the running IN-D-BOX process during install/generation, stop **only that existing service** during this window and restart it in step 9. Never stop MailEnable, PostgreSQL, Cloudflare Tunnel or any other application/service. Do not modify services, firewall, ports, Tunnel, DNS or www/canonical redirects.

Native command failures must halt the sequence. In PowerShell, run this immediately after each native command below, or check its exit code explicitly:

```powershell
if ($LASTEXITCODE -ne 0) { throw "Previous command failed; stop deployment." }
```

1. **Identify the current release and service configuration.** Set the actual existing service name; do not guess it or install another service.

   ```powershell
   $serviceName = Read-Host "Existing IN-D-BOX NSSM service name"
   git status --short
   git rev-parse HEAD
   git remote -v
   nssm get $serviceName Application
   nssm get $serviceName AppDirectory
   nssm get $serviceName AppParameters
   nssm get $serviceName AppStdout
   nssm get $serviceName AppStderr
   ```

   Record the deployed commit for rollback. Confirm the remote is `https://github.com/hedi216/indbox.git` and the working directory/service point to this checkout. Identify the existing environment source privately; do not print environment variables or secrets into tickets/logs. Resolve unexpected local source modifications before pulling; do not use `git reset --hard` or `git clean`.

2. **Back up PostgreSQL, uploads, the current release and production environments.** Use a protected backup directory outside the repository. Use the actual existing database/role; do not paste database passwords into commands or logs.

   ```powershell
   $backupDir = Read-Host "Protected backup directory outside the checkout"
   New-Item -ItemType Directory -Force $backupDir | Out-Null
   $databaseName = Read-Host "Existing production PostgreSQL database name"
   $databaseRole = Read-Host "Existing PostgreSQL backup role"
   pg_dump -h 127.0.0.1 -U $databaseRole -d $databaseName -Fc -f (Join-Path $backupDir "indbox-postgresql.dump")
   # Check LASTEXITCODE before continuing.
   Copy-Item uploads (Join-Path $backupDir "uploads") -Recurse
   if (Test-Path .env) { Copy-Item .env (Join-Path $backupDir "root.env") }
   if (Test-Path server/.env) { Copy-Item server/.env (Join-Path $backupDir "server.env") }
   ```

   Use the configured PostgreSQL host/port if different; preserve them. Also back up any externally located environment file and the existing release artifacts. If NSSM stores environment overrides, back up its service configuration privately to the protected directory using the existing server backup procedure. Check backup exit codes and verify a restore in isolation before release. All backup contents stay out of Git. Record baseline order, customer, stock and notification counts and keep an existing signed-in session for comparison.

3. **Pull the reviewed source without replacing environment files.**

   ```powershell
   git ls-files -- .env server/.env
   git check-ignore .env server/.env
   git fetch origin
   git switch main
   git pull --ff-only origin main
   git rev-parse HEAD
   ```

   The first command must list no real environment file; `check-ignore` should identify existing ignored environments. If a real environment is tracked, stop and reconcile before pulling. Confirm the resulting commit matches the reviewed release supplied after push. `.env` and `.env.*` remain ignored; only `.env.example` is tracked. **Never copy an example over production `.env`, import example DB/JWT values, or overwrite existing service environment settings.** Manually merge only the public SMTP/mail values above, leaving `MAIL_DELIVERY_ENABLED=false` and `MAIL_DELIVERY_NOT_BEFORE=`. Preserve `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT`, `TRUST_PROXY`, paths and any other deployment settings. Confirm existing files still match their backups except for these intentional edits.

4. **Install locked dependencies on Windows.**

   ```powershell
   npm ci
   ```

   Keep build/dev dependencies installed for Prisma and TypeScript; do not use `--omit=dev`. Do not copy another OS's node_modules. Use `npm ci --include=dev` if the existing environment sets npm to omit dev dependencies.

5. **Generate the Windows Prisma Client.**

   ```powershell
   npm run db:generate
   ```

6. **Check migration status against the correct database.**

   ```powershell
   npx prisma migrate status --schema server/prisma/schema.prisma
   ```

   Confirm privately that the shell and NSSM use the same intended database. Pending migrations make this command return nonzero: review its report rather than treating that as permission to continue automatically. The expected new pending migration is `202610090001_account_security`. If earlier migrations are missing or checksums/history differ, stop and investigate. Never baseline, reset, recreate or seed the existing production database as a shortcut.

7. **Apply the reviewed account-security migration.** After testing the upgrade against a restored staging copy and reviewing the SQL/lock duration:

   ```powershell
   npm run db:migrate
   # Check LASTEXITCODE before continuing.
   npx prisma migrate status --schema server/prisma/schema.prisma
   ```

   `db:migrate` runs `prisma migrate deploy` and applies all pending migrations, so proceed only after step 6 confirms the expected set. No seed, reset, `db push` or `migrate dev` is permitted. The final status must be up to date.

8. **Build backend and frontend.**

   ```powershell
   npm run build
   ```

   Confirm `server/dist/index.js`, `server/dist/mail-check.js` and `client/dist/index.html` exist. Abort on build failure. Keep uploads and environment files intact.

9. **Restart only the existing IN-D-BOX NSSM service.**

   ```powershell
   nssm restart $serviceName
   nssm status $serviceName
   ```

   If this service was stopped for dependency installation, use `nssm start $serviceName` instead. Keep its current configuration unchanged. Do not restart or reconfigure any other service.

10. **Verify health and existing accounts.**

    ```powershell
    Invoke-RestMethod https://indbox.tn/api/health
    ```

    Expect PostgreSQL health to be OK. Inspect the existing application logs, storefront/assets, admin/manager permissions, customer login, the previously signed-in session, order history and baseline counts. Check guest checkout and existing payment arrangements without making real customer purchases. Preserve the current www redirect if configured. Confirm sending remains disabled and old queue attempts/statuses have not changed.

11. **Verify authentication workflows with operator-owned test accounts.** Validate customer registration/welcome queueing, verification resend, generic forgot-password response, password policy indicators and backend validation; employee creation without a chosen password, first-login restrictions, 24-hour expiry, credential regeneration and preferences. With delivery disabled, security emails remain queued and their admin previews are redacted: do not weaken these controls or expose queued secrets to complete a test. Full email-link/credential round trips must be verified on isolated Windows staging with controlled SMTP before activation, then repeated for fresh operator accounts after step 13. Confirm production expiry fields, audit/outbox metadata and existing-account access now. Never run automated tests or seeds against production.

12. **Verify one controlled SMTP delivery while application mail remains disabled.** The explicit operator diagnostic below sends exactly one fresh test message and does not import the database, start the worker, touch queued notifications, or change any environment file.

    ```powershell
    $operatorEmail = Read-Host "Email address owned by the operator"
    npm run mail:check -w server -- --to $operatorEmail
    ```

    Run it under the same mail settings as the service; confirm `MAIL_DELIVERY_ENABLED=false`, `SMTP_HOST=127.0.0.1`, `SMTP_PORT=25`, `SMTP_SECURE=false`, empty auth and Reply-To. It requires an explicit single recipient and refuses to run while application delivery is enabled. SMTP acceptance is not proof of inbox receipt: confirm Gmail/operator inbox delivery and SPF/DKIM/DMARC results, the exact no-reply sender, absence of Reply-To, public URL and mandatory signature in both HTML and plain text. The signature ends with “Email généré par BizzRes, une solution de Comeleon Studio.” and https://www.comeleonstudio.com. Do not run the diagnostic with customer recipients.

13. **Manually activate only after approval of all previous validation.** Inspect queued notification counts by status and creation time. Finish all test traffic. Generate a future UTC cutoff, leaving sufficient time to edit configuration and restart:

    ```powershell
    [DateTime]::UtcNow.AddMinutes(10).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    ```

    Manually place that timestamp in `MAIL_DELIVERY_NOT_BEFORE` in the existing environment source. Only then, when the operator explicitly decides to activate delivery, set `MAIL_DELIVERY_ENABLED=true` and restart **only** the existing IN-D-BOX service. No script in this release changes this switch automatically. Confirm the timestamp is still in the future at restart; keep the fixed cutoff on subsequent restarts and never move it backward.

    Messages created before the cutoff remain held, including pending/retry/abandoned sending rows; expired security messages never deliver. Do not delete old history or bulk-retry test mail. After the cutoff, use fresh operator-owned accounts/messages to verify complete email-link and temporary-password flows plus the outbox's SENT status and unchanged old-row attempts. Regenerate older invitations and request fresh links instead of retrying old security mail. Check opted-in staff recipients before generating operational tests; do not accidentally notify real staff/customers. If verification fails, manually set delivery back to false and restart the IN-D-BOX service, then investigate. Record release commit, migration status, operator, validation evidence and activation time.

## Rollback

Disable sending and restart/stop the current worker before reverting application files. Restore the previous release while retaining the production database, uploads and JWT secret. **The previous mail worker does not honor the new delivery switch/cutoff:** before starting an older release, remove SMTP_HOST from its effective runtime environment (retain credentials in the protected backup), so it cannot flush the backlog. Do not drop the additive columns/tables or delete notification history. An older application does not enforce `mustChangePassword`: do not roll back to it with active temporary-credential accounts. Prefer a forward fix; otherwise restrict newly invited accounts before starting the old application under a separately reviewed recovery plan. Verify health/login/order history again. An email already accepted by the provider cannot be recalled; retries retain stable Message-IDs but SMTP is not exactly-once delivery.

## Reproducible isolated validation

Run `npm run test:isolated` from the repository root with PostgreSQL tools on PATH, or set `TEST_PG_BIN` to their directory (PowerShell: `$env:TEST_PG_BIN = 'C:\Program Files\PostgreSQL\16\bin'`). Install the Playwright browser first with `npx playwright install chromium` if needed. The runner creates a fresh temporary PostgreSQL cluster on free local ports, explicitly overrides database/SMTP variables, applies migrations, seeds **only that isolated database**, generates Prisma, builds both apps, runs the full API/SMTP/security suite and all Chromium E2E tests, then stops its servers. It never reads production database credentials for connection purposes or sends external email. Do not run it on the live production service path; use staging or a developer machine. Temporary test data is retained under the printed temporary directory for diagnosis, not used by the application.

Before production activation, manually verify: old account login and unexpired sessions; new staff invitation/change/regeneration and preferences; customer verification/resend/reset/change; all operational alerts; low-stock threshold crossing; and both email formats against an operator-controlled recipient. Keep sending disabled while performing staging tests. Regenerate invitations after enabling SMTP if their creation time predates the cutoff or their 24-hour window expired. Likewise request fresh verification/reset links instead of releasing historical security mail.

No Cloudflare, Windows firewall, NSSM configuration or service port changes are part of this release. Deployment and production verification remain pending until an operator performs the checklist.

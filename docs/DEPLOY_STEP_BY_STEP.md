# Deploy VendorReady — step-by-step (for a beginner)

**Goal:** Deploy the completed assignment as one public Cloudflare Worker hosting a React web app, REST API and protected remote MCP endpoint; connect a real D1 database.

**Important:** GitHub holds the code; Cloudflare hosts the running website/backend. GitHub Pages alone cannot run this server and database.

## 0. What I need

- Mac/Windows/Linux with Node.js **22.18+** and npm installed
- Git installed
- Free GitHub account
- Cloudflare account with Workers and D1 enabled
- Claude account with custom remote connectors

Do not share your account passwords, API keys or the private `.dev.vars` file.

## 1. Get the source code

Download `VendorReady_Volopay_Submission.zip` and unzip it. Open Terminal **inside the `vendorready-volopay` folder**.

```bash
cd /path/to/vendorready-volopay
node -v
npm -v
npm install
npm run test
npm run check
```

- `cd` changes into the project folder.
- `npm install` downloads project dependencies listed in `package.json`.
- `npm run test` executes domain tests.
- `npm run check` checks TypeScript.

If a command fails, fix the first error before going on.

## 2. Sign into Cloudflare

```bash
npx wrangler login
```

Your browser opens. Choose the Cloudflare account where you want to deploy. Authorize Wrangler.

## 3. Create the real SQL database

```bash
npx wrangler d1 create vendorready-db
```

Wrangler prints a `database_id` UUID. Open `wrangler.jsonc` and replace:

```text
REPLACE_WITH_YOUR_D1_DATABASE_ID
```

with the printed UUID. Keep the quotes around the ID. Do not change the `binding`: it must stay `DB`.

A D1 database is a small hosted SQLite database. We use it to save supplier and checklist changes permanently.

## 4. Create development-only secrets

Copy `.dev.vars.example` to `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

For each value in `.dev.vars`, set **a different strong randomly-generated secret**. Generate each one using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set:

- `DEMO_PASSWORD`: the password for logging into the demo workspace
- `SESSION_SECRET`: signs browser login sessions
- `MCP_API_KEY`: credential Claude must present with every MCP request

**Never commit or share the real `.dev.vars` file.** It is ignored by Git.

The demo username is always `demo@vendorready.app`.

## 5. Create local database tables

```bash
npm run db:local
```

This executes `migrations/0001_initial.sql` on Wrangler's local D1 database. When asked, confirm applying the migration.

## 6. Test locally

In Terminal:

```bash
npm run dev
```

This builds React and starts Cloudflare's local development server. Open the exact localhost URL printed by Wrangler, generally `http://127.0.0.1:8787`.

Sign in with:

- Email: `demo@vendorready.app`
- Password: your `.dev.vars` `DEMO_PASSWORD`

You should see the dashboard. No suppliers appear until Claude creates them. This is intentional.

To verify the local MCP endpoint, use MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Select **Streamable HTTP** and point it at `http://127.0.0.1:8787/mcp`. Enter the custom header `X-VendorReady-Key` with your `.dev.vars` MCP key (depending on your Inspector version, the header field may be in its authentication settings). `list_vendor_onboardings` should be discoverable.

## 7. Set production secrets (three commands)

In your project directory, run each command **one at a time**:

```bash
npx wrangler secret put DEMO_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put MCP_API_KEY
```

Paste the same three secret values you placed in `.dev.vars` when each command prompts you. The values go into Cloudflare's encrypted Workers secrets, not into your GitHub source code.

If Cloudflare asks you to create the Worker during this step, confirm.

## 8. Apply database migrations to production

```bash
npm run db:remote
```

Confirm the change when prompted. This creates your real database tables.

**Note:** `db:local` and `db:remote` are different databases. Running the local command alone does not set up production.

## 9. Deploy the app and server

```bash
npm run deploy
```

Wrangler builds the React UI and deploys the Worker, assets and MCP tool endpoint. It prints a real `https://...workers.dev` URL. Copy that exact URL.

Your links will be:

- Web app: `https://YOUR-ACTUAL-WORKER.workers.dev`
- MCP endpoint: `https://YOUR-ACTUAL-WORKER.workers.dev/mcp`
- Health check: `https://YOUR-ACTUAL-WORKER.workers.dev/api/health`

These are **formats**, not links that already exist. Your Worker URL comes from the deployment output.

## 10. Test app on the public internet

Open the live website in a private browser window and sign in. The supplier dashboard should appear.

Try `https://YOUR-ACTUAL-WORKER.workers.dev/api/health`. It should return JSON containing `"ok": true` and `"ai_inside_app": false`.

## 11. Connect Claude (the required assignment demo)

1. Open Claude.ai → **Customize → Connectors → Add custom connector** (the menus can vary slightly by account).
2. Name it **VendorReady**.
3. Paste the actual public URL ending in `/mcp`.
4. Under Authentication select **No sign in**.
5. Under **Request headers**, add:
   - Name: `X-VendorReady-Key`
   - Value: your production `MCP_API_KEY`
6. Add the connector, open a fresh Claude conversation, and **enable VendorReady** in the connector/tool menu.
7. Paste the sample prompt from the app's **Connect Claude** screen.
8. Approve Claude's actual `create_vendor_onboarding` tool call.
9. Open or refresh the VendorReady dashboard: the supplier should appear.
10. Open the supplier; edit the name or date; mark a requirement complete; refresh the page.
11. Ask Claude to call `get_vendor_onboarding` using the ID returned during creation. It should read the updated state.

Claude can send fixed request headers for custom remote MCP connectors. Documentation: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

**Important:** Claude may prompt for tool approval. If it merely writes a sample JSON response without invoking the tool, the test did not pass.

## 12. Push the source to a NEW GitHub repository

Visit https://github.com/new and create a repository named `vendorready-volopay`. Choose **Private** initially; make it public only if you want Volopay to see the source. Do not initialize it with a README or .gitignore (our package already has them).

Run locally inside the extracted project directory:

```bash
git init
git add .
git commit -m "Build VendorReady Volopay MCP assignment"
git branch -M main
git remote add origin https://github.com/pk-debug/vendorready-volopay.git
git push -u origin main
```

GitHub will require authentication; use your Git credential manager, GitHub CLI, or a personal access token as supported by your device. **Never put a personal access token in your repository or README.**

The repository lives on GitHub; the app itself is still hosted on Cloudflare.

If your GitHub account differs from `pk-debug`, change the repository URL accordingly.

## 13. Final submission

Submit using the official Volopay form:

https://forms.gle/oVg5iu8GFdope1a59

Submission checklist:

- [ ] A real public app URL that opens in a fresh browser
- [ ] Demo email `demo@vendorready.app` and your actual DEMO_PASSWORD
- [ ] Public HTTPS MCP URL ending `/mcp`
- [ ] MCP header name + test key provided privately in form instructions
- [ ] Claude connection instructions that a reviewer can follow
- [ ] Real Claude → MCP → D1 → web dashboard creation proven
- [ ] Edit and reload proven
- [ ] Pitch video under five minutes
- [ ] All links checked before submitting **11 Nov 2026, noon IST**

## Safety and scope

This is a scoped assessment demo, not a production enterprise procurement product. It has a single demo workspace and shared credentials. Do not use it for sensitive documents, real PAN details, bank numbers, or identity verification. For actual customers, introduce per-user authentication, authorization, rate limiting, audit logs, privacy controls, secure credential rotation, stronger retry/idempotency handling and account separation.

Never publish your production DEMO_PASSWORD, MCP_API_KEY or SESSION_SECRET in a public GitHub repository, video description or public issue. Share the demo access details only through the recruiter submission channel.

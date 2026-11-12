# VendorReady

A small business that runs on the customer's own Claude, with no AI inside the app.

VendorReady turns Claude instructions into live, editable supplier onboarding checklists using remote MCP. Claude interprets and drafts. VendorReady validates, persists, displays, edits and tracks completion.

Built for Volopay — Founder’s Office, Product & Growth — Product & Tech Assignment (November 2026).

## MVP capabilities

- Remote MCP tools: create_vendor_onboarding, get_vendor_onboarding, list_vendor_onboardings
- Cloudflare D1 persistence for suppliers and checklist items
- Human editing of supplier name, due date, contact, notes, checklist titles and completion
- Add/delete checklist items, progress, filters, search and overdue summary
- Browser login using a server-signed HttpOnly session cookie
- MCP authorization using a server-side secret and request header
- No model API calls, model SDKs for generation, or model API keys in the application
- One Cloudflare Worker deployment for React UI, REST API and remote MCP endpoint

## Architecture

- Customer → Claude.ai (customer's subscription)
- Claude → remote MCP request + fixed auth header → Cloudflare Worker /mcp
- Worker → validation → Cloudflare D1
- Browser → React UI → Worker /api/* → same D1 database

Claude runs outside VendorReady and pays for its own reasoning. VendorReady has no model keys or inference costs. MCP is the protocol used to connect Claude to the app.

## Live demo and Claude setup

- **Web app:** https://vendorready-volopay.coder-pawan1.workers.dev
- **Health check:** https://vendorready-volopay.coder-pawan1.workers.dev/api/health
- **Remote MCP server:** https://vendorready-volopay.coder-pawan1.workers.dev/mcp
- **Demo username:** `demo@vendorready.app`

The demo requires a password. It is intentionally not published in this repository. Request the current demo password and MCP key from the assignment owner through a private, reviewer-approved channel; do not put credentials in this README, a public issue, or the submission form.

### Connect Claude

1. In Claude, open **Customize → Connectors → Add custom connector**.
2. Name it **VendorReady** and use the remote MCP server URL above.
3. Choose **No sign-in**.
4. Under **Request headers**, add:
   - **Header name:** `Authorization`
   - **Header value:** enter the word Bearer, a space, then paste the privately provided MCP key.
5. Add the connector and enable it in a new Claude conversation. Approve VendorReady tool calls when prompted.
6. Test with fictional information only, for example: “Create a fictional supplier called Acme Demo Supplies with a due date of 2026-12-20 and a short onboarding checklist.”

To demonstrate persistence, open the supplier in the web app, make a harmless edit, refresh, then ask Claude to retrieve the supplier with `get_vendor_onboarding`. The app and Claude read and update the same D1-backed record. Checklist completion is human-reported; it does not verify documents, taxes, or bank details.

## Run locally

Requirements: Node.js 22.18 or later.

    npm install
    npm test
    npm run check
    npm run build
    npm run audit:no-ai

For local Cloudflare development, configure the D1 ID and local secrets as described in docs/DEPLOY_STEP_BY_STEP.md.

## Product and business hypothesis

- Initial customer: Indian SMB procurement, finance and operations teams with recurring supplier onboarding
- Problem: supplier requirements are scattered across chat messages, emails and spreadsheets
- MVP promise: create a structured readiness workspace from Claude and keep the result editable after the chat ends
- Pilot price hypothesis: ₹999 per organization per month (not validated)
- Initial acquisition hypothesis: founder-led outreach, five pilot teams and accountant/finance operator referrals
- Main risk: teams may prefer spreadsheets or a larger vendor management system; customer interviews are required

See docs/PRODUCT_BRIEF.md, docs/VIDEO_PITCH.md and docs/QA_CHECKLIST.md.

## Automated checks and deployment

Pull requests and pushes to main run GitHub Actions CI: unit tests, TypeScript check, frontend build and a scan for model API keys/calls.

To deploy to Cloudflare, create the D1 database and configure the six repository secrets described in docs/GITHUB_ACTIONS_DEPLOYMENT.md. Then manually run Actions → Deploy VendorReady to Cloudflare.

## Demo security limitations

This is an assessment prototype with one shared fictional workspace, not a production multi-tenant SaaS. It does not independently verify tax registrations, bank accounts or documents. Do not store real PAN details, bank account numbers, identity documents or sensitive supplier files. Production use would require per-organization authorization, rate limiting, audit logs, stronger account separation and a security review.

If a demo credential is exposed, rotate it immediately rather than reusing it. Update the `DEMO_PASSWORD` or `MCP_API_KEY` GitHub Actions repository secret as appropriate, then run **Actions → Deploy VendorReady to Cloudflare** again so the encrypted Worker secret is updated.

## Repository structure

- src/: React UI, sign-in, dashboard and editing
- worker/: MCP server, REST API, D1 operations and session auth
- migrations/: D1 SQL schema
- scripts/: no-AI-source audit
- tests/: domain unit tests
- docs/: product brief, deployment, QA, pitch and submission guide
- .github/: CI and manual Cloudflare deployment workflows
- wrangler.jsonc: Worker, assets and D1 configuration

## Deployment status

The app and remote MCP endpoint are deployed at the live URLs listed above. The deployment workflow is manual; see [GitHub Actions deployment instructions](docs/GITHUB_ACTIONS_DEPLOYMENT.md) for redeploying or rotating Worker secrets.

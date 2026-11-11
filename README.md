# VendorReady

**A small business that runs on the customer's own Claude, with no AI inside the app.**

VendorReady turns Claude instructions into live, editable supplier onboarding checklists using remote MCP. Claude interprets and drafts. VendorReady validates, persists, displays, edits and tracks completion.

Built for **Volopay — Founder’s Office, Product & Growth — Product & Tech Assignment** (November 2026).

## What actually works

- Remote MCP tools: `create_vendor_onboarding`, `get_vendor_onboarding`, `list_vendor_onboardings`
- Real persistence in Cloudflare D1 (supplier and checklist tables)
- Human editing: supplier name, due date, contact, notes, checklist titles and completion
- Add or delete checklist items
- Completion progress, filters, search, overdue summary
- Browser login using a server-signed HttpOnly session cookie
- MCP authorization through a server-side secret and request header
- No AI-model API calls, model SDKs used for generation, or model API keys anywhere in the app
- One Cloudflare Worker deployment for React UI + REST API + MCP endpoint

## Architecture

```text
Customer → Claude.ai (customer's subscription)
                │ MCP tool call (auth header)
                ▼
       Worker /mcp → validation → D1 database
                                   ▲
Browser → React UI → /api/* → Worker ┘
```

### Important distinction

Claude runs *outside* VendorReady and pays for its own reasoning. VendorReady has no model keys or inference costs. Model Context Protocol is a standard for communicating with external tools, not an AI model.

## Quick start

The entire installation and deployment checklist is in **[docs/DEPLOY_STEP_BY_STEP.md](docs/DEPLOY_STEP_BY_STEP.md)**. It includes exact commands for installing packages, creating the D1 database, configuring secrets, deploying, connecting Claude and publishing the GitHub repository.

```bash
npm install
npm run test
npm run check
# Configure wrangler.jsonc D1 UUID and .dev.vars secrets first.
npm run db:local
npm run dev
```

For production, run the secret setup, `npm run db:remote` and `npm run deploy` as described in the guide.

## MCP example

> Use the connected VendorReady tool to create a supplier onboarding for ABC Industrial Services. Due date 2026-11-20. Requirements: GST evidence, PAN documentation, signed agreement, contact information and bank verification confirmation.

The `create_vendor_onboarding` tool returns the supplier ID and a confirmation. Human users open the web app to edit and complete the saved checklist. Claude can retrieve the current state using `get_vendor_onboarding`.

**Authentication:** `X-VendorReady-Key` must equal the `MCP_API_KEY` Worker secret. Never hardcode the key in source.

## Product and business

- **ICP:** Indian SMB procurement, finance and operations teams with a recurring supplier onboarding workflow
- **Problem:** Supplier requirements are scattered across chat messages, emails and spreadsheets
- **MVP promise:** Create a structured readiness workspace directly from Claude and retain human-editable status after the chat ends
- **Pilot price hypothesis:** ₹999 per organization per month (not validated)
- **Initial acquisition:** interviews, founder-led outreach, five pilot teams, accountant/finance operator referrals
- **Differentiator hypothesis:** easier pre-onboarding workspace for small teams using their existing Claude account
- **Biggest risk:** teams may prefer spreadsheets or a larger vendor management system; needs customer validation

See [docs/PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) and [docs/VIDEO_PITCH.md](docs/VIDEO_PITCH.md).

## Demo security limitations

This uses one shared fictional workspace (not a full multi-tenant SaaS). Shared demo credentials, brute-force rate limiting and production access management need additional engineering. Do not store live financial documents or real personal identification information. Checklist completion does not mean a bank account or tax registration has been independently verified.

## Repository structure

```text
src/           React app UI, sign-in, dashboard and editing
worker/        MCP server, REST endpoints, D1 operations, session auth
migrations/    D1 SQL schema
scripts/       Optional helpers
 tests/        Domain unit tests
 docs/         Deployment walkthrough, pitch and business brief
wrangler.jsonc Cloudflare Worker assets and D1 binding configuration
```

## Deployment status

This repository is deployment-ready source code. A real live URL, MCP connector link and a verified Cloudflare deployment require the owner to authorize a Cloudflare account and configure secrets. Do not represent this repository alone as a live submission.

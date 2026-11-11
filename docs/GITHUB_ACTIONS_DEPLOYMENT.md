# Deploy VendorReady with GitHub Actions

This repository includes a manual Cloudflare deployment workflow. It does not deploy automatically on every commit. Create a Cloudflare D1 database and add secrets first.

## 1. Create Cloudflare resources

1. Sign in to the Cloudflare dashboard.
2. Open Workers & Pages, then D1 SQL Database.
3. Create a database named vendorready-db.
4. Copy its database UUID. Save it as the GitHub secret D1_DATABASE_ID.
5. Find your Cloudflare Account ID in the account overview.

## 2. Create a Cloudflare API token

Create an account-scoped API token for this repository's deployment workflow. Start with Cloudflare's Edit Cloudflare Workers template and add D1: Edit so Wrangler can apply the database migration. The token must be allowed to create the initial Worker named vendorready-volopay. If it is restricted to existing Workers only, create the Worker once in the dashboard and grant the token edit access to it.

Do not paste this token into source code, README files, chat messages, or the video.

## 3. Add GitHub Actions secrets

In GitHub, open Repository → Settings → Secrets and variables → Actions → New repository secret.

Create all six secrets:

| Secret name | Value |
|---|---|
| CLOUDFLARE_API_TOKEN | The Cloudflare API token |
| CLOUDFLARE_ACCOUNT_ID | Your Cloudflare account ID |
| D1_DATABASE_ID | UUID of the vendorready-db D1 database |
| DEMO_PASSWORD | Strong demo login password |
| SESSION_SECRET | Random secret of at least 32 characters |
| MCP_API_KEY | Different random secret of at least 32 characters |

Generate random values on your Mac:

    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Run the command separately for SESSION_SECRET and MCP_API_KEY. Choose a different strong value for DEMO_PASSWORD. Never commit these values.

## 4. Run deployment

1. Open the repository's Actions tab.
2. Select Deploy VendorReady to Cloudflare.
3. Click Run workflow.
4. In the confirmation field, type exactly DEPLOY.
5. Start the workflow and wait for every step to turn green.

The workflow installs packages, applies the D1 migration, builds the React app, deploys the Cloudflare Worker, and stores the three Worker secrets using Cloudflare's encrypted secret store.

## 5. Record the actual URLs

Copy the exact workers.dev URL printed in the deployment log. Do not guess the subdomain.

- Web app: https://<actual-worker-url>
- Health check: https://<actual-worker-url>/api/health
- Remote MCP: https://<actual-worker-url>/mcp

The health check should return JSON with ok=true and ai_inside_app=false.

## 6. Connect Claude

In Claude, go to Customize → Connectors → Add custom connector. Add the exact MCP URL ending in /mcp. Choose No sign in, then add this fixed request header:

- Header name: X-VendorReady-Key
- Header value: the value stored as GitHub secret MCP_API_KEY

Enable VendorReady in a fresh Claude conversation and invoke create_vendor_onboarding. Verify the supplier appears in the web app, edit it, refresh, and use get_vendor_onboarding to confirm Claude sees the edited value.

## 7. Demo credentials

- Username: demo@vendorready.app
- Password: the value stored in DEMO_PASSWORD

Share the password and MCP key only through the recruiter's private submission channel. Never publish them in this repository or video.

## Troubleshooting

- Missing secret: check spelling and confirm all six GitHub Actions secrets exist.
- D1 not found: verify the database UUID belongs to the same Cloudflare account as the API token.
- Permission denied: update the token permissions for Workers deployment and D1 migrations.
- Login says server setup incomplete: verify the three Worker secrets were set successfully and the D1 migration completed.
- Claude cannot connect: confirm the MCP URL is public HTTPS, the header is exactly X-VendorReady-Key, and the value matches MCP_API_KEY.

This is an assessment demo using one shared fictional workspace. Do not use real supplier PAN, bank account details, or sensitive documents.

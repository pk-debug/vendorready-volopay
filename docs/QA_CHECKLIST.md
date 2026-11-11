# Submission verification — perform against the live deployment

## MCP and Claude

- [ ] A fresh Claude chat can enable the custom VendorReady connector.
- [ ] `list_vendor_onboardings` is listed among tools.
- [ ] `create_vendor_onboarding` genuinely executes and returns a unique supplier ID.
- [ ] A new supplier record appears on the deployed dashboard without copying content manually.
- [ ] Incorrect MCP key returns HTTP 401.
- [ ] An invalid due date is rejected.
- [ ] An empty requirements array is rejected.
- [ ] Retrying the same idempotency key does not produce another supplier.
- [ ] `get_vendor_onboarding` returns data updated through the browser.

## Browser

- [ ] Fresh/incognito window shows login.
- [ ] Wrong password is rejected.
- [ ] Correct demo credentials sign in.
- [ ] Supplier list, search and filters work.
- [ ] Edits to supplier details persist after refresh.
- [ ] Checklist completion persists after refresh.
- [ ] Add, rename and delete requirements work.
- [ ] Empty checklist never incorrectly reports 'ready'.
- [ ] Session logout blocks subsequent access.
- [ ] Mobile layout remains usable.

## Submission

- [ ] Web app HTTPS URL
- [ ] MCP HTTPS URL ending in `/mcp`
- [ ] Demo username and password supplied *privately*
- [ ] MCP header name and test key supplied *privately*
- [ ] Five-minute maximum video with actual MCP demo
- [ ] Working links tested in clean browser session
- [ ] Business economics labeled hypotheses; no made-up traction
- [ ] Deadline: 11 Nov 2026, 12:00 PM IST

Status: none of the above live-deployment checks are claimed completed until verified on an actual Cloudflare/Claude account.

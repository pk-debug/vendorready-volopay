# Volopay submission fields — replace placeholders with your actual verified links

**Project:** VendorReady — supplier readiness tracking from Claude, with no AI inside our app.

**Live application URL:** `https://<ACTUAL_WORKER_URL>`

**Demo login:**
- Username: `demo@vendorready.app`
- Password: `<PRIVATE_DEMO_PASSWORD>` (share only in submission, not public repository)

**Remote MCP URL:** `https://<ACTUAL_WORKER_URL>/mcp`

**MCP authentication:** Choose **No sign in** and add fixed request header:
- Header name: `X-VendorReady-Key`
- Header value: `<PRIVATE_MCP_API_KEY>` (share only in submission)

**Connect:** Claude → Customize → Connectors → Add custom connector → URL above → No sign-in → Request headers → save. Enable VendorReady in chat. Ask: "Use create_vendor_onboarding to create ABC Industrial Services, due 2026-11-20, with GST evidence, PAN, signed agreement, company contact and bank verification checklist." Open the app, edit and refresh.

**5-minute pitch video URL:** `<ACTUAL_VIDEO_LINK>`

**GitHub repository (optional):** `https://github.com/pk-debug/vendorready-volopay` (only include after it exists)

**Claim only after testing:** The actual Claude invocation creates a supplier record in D1, and the website can read and edit it persistently.

Submit via https://forms.gle/oVg5iu8GFdope1a59 before **11 November 2026 12:00 PM IST**.

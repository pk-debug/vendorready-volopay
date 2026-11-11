# Five-minute founder pitch — recording script and shot list

**Maximum allowed video:** 5:00 minutes. Aim to record around 4:30–4:45 to leave a margin. Talk clearly; rehearse before recording. The five sections follow Volopay's assignment PDF.

## 0:00–0:45 — Who I am (camera)

"Hi, I'm Pawan Kumar, a product-minded software engineer with over six years of experience shipping apps across consumer products, banking, insurance and payments. I've worked with engineers, QA and stakeholders to take ideas into real production features. I'm applying to Volopay because I enjoy the combination of identifying business problems, making product trade-offs and actually building the solution. For this assignment, I built VendorReady."

## 0:45–1:15 — Best work (camera + one evidence slide)

"One result I'm proud of is helping improve crash-free sessions on an insurance field-sales application from 95% to 99.8%. I used production crash data to focus fixes on what mattered most to real users. That taught me to prioritize customer impact and product reliability over the number of features shipped."

Use the exact achievement from your submitted resume. Do not imply you achieved team outcomes single-handedly if that isn't accurate.

## 1:15–2:15 — Business thesis (show one problem slide + dashboard)

"Small finance and operations teams onboard suppliers through emails, chat and spreadsheets. Claude can draft a checklist, but the result often stays inside the conversation. VendorReady turns that into a real shared record. A team member asks Claude to prepare onboarding requirements; Claude invokes our MCP tool, and VendorReady saves the supplier with persistent requirements, due dates and editable status. Unlike a full procurement suite, this starts with one small job: supplier readiness before handoff. Customers bring their own Claude account. Our application makes no AI model calls, so our infrastructure doesn't pay inference costs. Our hypothesis is that simple recurring workflows are worth paying for."

## 2:15–4:15 — Real live demo (screen recording)

**Do not fake this sequence. Record an actual successful run.**

1. Show Claude with the VendorReady connector enabled.
2. Paste the test prompt from the app's Connect Claude screen.
3. Show Claude invoking `create_vendor_onboarding` and receiving a successful result with a supplier ID.
4. Switch to the deployed VendorReady website and sign in. (Hide passwords/keys while recording.)
5. Refresh the supplier list and open the new supplier.
6. Edit the target date or supplier name and save.
7. Tick one checklist item and refresh to prove persistence.
8. Optional: return to Claude, invoke `get_vendor_onboarding` with that supplier ID, and show the updated state.

Narration: "This is a real MCP connection — not a pasted JSON response. The record is stored in D1, and edits are written back to the same database. Claude writes and reasons; the app keeps the operational state live."

## 4:15–5:00 — Economics & growth (camera + simple metric slide)

"Our initial price hypothesis is ₹999 per organization per month. Customers supply their own Claude usage, while we pay for hosting, storage, support and distribution. At 100 paying teams that would be roughly one lakh rupees of monthly recurring revenue, before costs and taxes. My first step would be to recruit five design partners among small finance and operations teams, validate repeated use, and then pursue 100 customers through direct outreach and referrals. Longer term, I'd add supplier collaboration and finance integrations only if customer evidence supports them. The biggest risk is whether users would pay rather than use spreadsheets; the pilots are designed to answer that."

## Before submission

- Check that the recording is under 5:00.
- Hide any demo password, MCP secret, Cloudflare secrets or admin dashboards.
- Confirm the real Claude invocation and real database changes are visible.
- Use a recorded MP4 or a private/unlisted video link accessible to reviewers.
- Keep this script natural. Don't present untested business hypotheses as proven metrics.

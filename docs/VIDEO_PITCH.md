# VendorReady — five-minute video script

The form requires an accessible video link no longer than five minutes. This script is designed for a camera introduction, a real screen demonstration, and a concise business pitch. Speak naturally and leave short pauses while pages load or tools run. Do not show passwords, API keys, Cloudflare settings, or other private information.

## 0:00–0:40 — Introduction (camera)

**Say:**

"Hi, I'm Pawan Kumar. I have over six years of experience shipping products across consumer apps, banking, insurance, and payments, and I'm now moving into product management. I'm interested in Volopay's Founder’s Office, Product and Growth role because it combines customer problem-solving, product execution, and business outcomes. For this assignment, I built VendorReady, a supplier onboarding workspace connected to Claude through MCP."

## 0:40–1:10 — What I built (camera, then switch to dashboard)

**Say:**

"A piece of work I'm proud of is helping improve crash-free sessions on a field-sales insurance app from 95% to 99.8%. I used Crashlytics data to prioritize fixes by their impact on users and also worked on strengthening app security. Earlier, I owned the launch of four consumer apps, which together reached more than two million downloads. Those experiences taught me to pair product quality with user impact and adoption."

## 1:10–1:55 — Customer problem and solution (show dashboard)

**Say:**

"The first customer hypothesis is a small finance, procurement, or operations team that repeatedly collects supplier information using email, chat, and spreadsheets. Requirements can be scattered, and it can be hard to tell what is still outstanding.

"With VendorReady, a team member asks Claude to create an onboarding checklist. Claude calls the VendorReady MCP tool, and the application saves the supplier and checklist. A manager can then open the web dashboard, update the details or checklist, and keep the latest status in one place. Claude can retrieve that updated record later. The product hypothesis is that persistence and human editing make an AI-assisted draft useful as an ongoing team workflow, rather than a one-off chat answer.

"Claude runs using the customer's own account. VendorReady does not make AI model calls. The prototype tracks human-reported checklist completion; it does not independently verify documents, taxes, or bank details."

## 1:55–4:05 — Live product demonstration (share screen)

**Show:** Claude with the VendorReady connector enabled. Use the existing fictional Acme Test Supplies record or create a fresh fictional record. Keep the MCP key and all credentials off screen.

**Say:**

"Here is Claude with the VendorReady connector enabled. I'm using fictional test information only. I'll ask Claude to create a sample supplier onboarding record."

**Do:** Ask Claude to create a fictional supplier and checklist. Approve the `Create vendor onboarding` tool call. Wait for the result.

**Say:**

"Claude has called the VendorReady tool and returned a supplier record. I can now switch to the live VendorReady application and find that same record in the dashboard."

**Do:** Open the deployed app. If prompted, sign in without recording or revealing the password. Open the fictional supplier. Show its details and checklist.

**Say:**

"This is the record Claude created. The checklist is editable here, so the team is not locked into the original response. I'll make a small change to a checklist item and save it."

**Do:** Edit one checklist item or a harmless supplier detail and save. Refresh the page and show the change remains.

**Say:**

"After refreshing, the edit is still here. The browser and Claude are working with the same persisted record. I'll return to Claude and ask it to retrieve the latest version."

**Do:** In Claude, request the supplier using the VendorReady `Get vendor onboarding` tool. Approve the call if asked. Show the returned updated value.

**Say:**

"Claude can now see the value I changed in the app. That is the key workflow I wanted to demonstrate: Claude creates, a person edits, and Claude can read the updated state. The supplier and checklist are fictional, and a checked item is not proof of legal, tax, or banking verification."

## 4:05–5:00 — Business model, validation, and vision (camera or simple slide)

**Say:**

"The initial price hypothesis is 999 rupees per organization per month. It is not validated yet. Customers would bring their own Claude subscription; VendorReady would still have hosting, support, security, and customer acquisition costs. I would start with five small-business design partners, learn whether they use the workflow repeatedly, and test willingness to pay through direct outreach and referrals. My consumer-app experience reaching more than two million combined downloads also reinforced that building the product is only part of the job; teams need to find users and earn continued use.

"In year one, I would focus on those pilots, improve the core workflow, and establish secure organization-level access before handling real supplier data. In year three, if customers show repeat use and the economics work, I would consider supplier collaboration, reminders, and selected finance integrations. Those are future possibilities, not features in this prototype.

"The main risk is that teams may prefer spreadsheets or existing procurement systems. I would test that assumption with customers before expanding. Thank you for watching."

## Recording checklist

- Keep the final video below five minutes; do a timed rehearsal first.
- Share the screen during the real Claude-to-app demo; the video should not be only a spoken pitch.
- Hide the demo password, MCP key, Cloudflare dashboard, and any personal or account information.
- Use fictional supplier data only. Do not imply that placeholder checklist items have been verified.
- Confirm the uploaded video link is accessible to reviewers before submitting it.
- If you add a personal achievement or metric, include it only if it is accurate and consistent with your resume.

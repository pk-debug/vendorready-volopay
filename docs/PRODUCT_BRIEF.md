# VendorReady — Product brief (Volopay Founder’s Office)

## Vision
A lightweight, persistent supplier onboarding readiness workspace created from Claude and maintained by people.

## For whom
Small B2B businesses whose finance/procurement teams routinely collect supplier agreements, registration evidence, contact details and internal sign-offs using email, WhatsApp and spreadsheets.

## Problem
Claude can suggest onboarding requirements, but its answer isn't a shared operational source of truth. People need a continuously available record they can correct and mark complete.

## Solution
The user types a plain-English request in their own Claude. Claude calls a VendorReady MCP tool, which saves a real supplier and checklist to Cloudflare D1. A manager signs in and edits the record in a browser. Those edits persist and are retrievable from Claude.

## Features built in MVP
- Create supplier and 1–20 checklist items through real remote MCP
- Read/list records through MCP
- List/filter/search suppliers in the web interface
- Edit supplier details, notes, checklist titles and completion status
- Add/delete requirements, calculate readiness, show overdue work
- Protected MCP write actions and signed demo browser session

## Explicit non-goals
No supplier-upload portal, legal/tax verification, bank account checks, email reminders, payment initiation, ERP integration, subscription processing, document uploads, AI SDK integration or multi-tenant enterprise authorization.

## Success criteria
1. Claude uses the remote MCP tool and creates an actual database record.
2. The supplier appears on the deployed app without copying Claude output.
3. The evaluator edits and checks a requirement, refreshes and sees the changes.
4. Claude can retrieve the revised record with a read tool.
5. No OpenAI or Anthropic model keys exist in the app or source.
6. Evaluator can connect using included URL, header and credentials.

## Business model (hypotheses; not proven)
- ₹999/month per organization as an introductory test price.
- At 100 paying organizations, hypothetical MRR ₹99,900 and annualized subscription revenue ₹11,98,800 *before* expenses and taxes.
- Model inference is the customer's expense; costs remain for hosting, database, support, payment processing, monitoring and customer acquisition.
- First five design partners recruited through direct SMB finance/operations outreach.
- Roadmap contingent on repeat use and willingness to pay: supplier-side portal, reminder workflows, document intake and finance integrations.

## Main risks
- Small businesses may prefer Excel or existing onboarding modules.
- Shared secret/demo workspace does not provide enterprise security.
- Authentication and connector compatibility must be tested live.
- Vendor readiness is a human-maintained checklist, **not compliance verification**.

## Why not Claude alone?
Claude supplies the initial content. VendorReady provides durable IDs, controlled operations, shared status, later edits, database persistence, and an interface for non-Claude users. This is the business's core value proposition.

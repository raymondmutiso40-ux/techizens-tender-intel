# Tender Intelligence

AI-assisted tender review for both sides of a tender.

- **Bidders** upload a tender and get its requirements extracted with page-level evidence.
- **Issuers** upload a tender and every proposal they received. Each proposal is checked against the mandatory requirements, marked Passed, Needs review or Failed, and the passed proposals are summarised side by side.

Built for the Zanari Analytics Business Development Intelligence and Revenue Assurance challenge (AI and Automation). The selected workflow is procurement intelligence (tender analysis), extended with an issuer-side proposal check.

> AI output is decision support only. It is not legal or procurement advice. A responsible person approves every bid, shortlist, price and commitment.

---

## Target users

| User | Need |
| --- | --- |
| Bid and business development teams | Understand a tender quickly and spot eligibility gaps before committing effort |
| Tender issuers and procurement reviewers | See which of many proposals meet the mandatory requirements, with evidence, and get a summary of those that do |

## Problem

Tenders are long and full of eligibility, technical and commercial conditions. Reading them by hand is slow, and bidders miss mandatory requirements or pursue tenders they cannot win. Issuers receive many proposals and spend review time on proposals that were never eligible.

---

## What is implemented

| Feature | Status |
| --- | --- |
| Tender PDF upload and text extraction by page | Working |
| AI extraction of title, entity, reference, deadline, submission method and requirements | Working |
| Page number and verbatim quote for every requirement | Working |
| Quote check: the code verifies the quote really appears on the cited page | Working |
| Conflicting values (for example two deadlines) flagged as an extra requirement | Working (prompt based) |
| Issuer workspace: select a tender, upload many proposals | Working |
| Per-requirement check of each proposal: Covered, Partial or Missing, with page and quote | Working |
| Verdict per proposal: Passed, Needs review, Failed | Working |
| Summary of passed proposals (approach, timeline, price, team, strengths, concerns) and an at-a-glance table | Working |
| Human decision per proposal: Shortlist, Reject, Clear | Working |
| Landing page and role-based demo login (Bidder, Issuer) | Working |

## How the checks work

**Tender extraction**

1. The PDF is read page by page, so every fact keeps its page number.
2. The text is sent to Gemini with a strict JSON format. The prompt says to use only the document, return null when a field is missing, and give a verbatim quote and page for each requirement.
3. The code checks each quote against the cited page. A quote that is not found is labelled "quote NOT found on page" with lower confidence.

**Proposal check (issuer)**

1. Eligibility, mandatory-document and technical requirements of the tender are listed.
2. The proposal text is sent to Gemini, which returns for each requirement a status (Covered, Partial or Missing), a page, a verbatim quote and a one-line note.
3. A Covered claim without a quote that is really on the cited page is downgraded to Partial.
4. Verdict rule, based on mandatory requirements (eligibility and mandatory documents) only:
   - any Missing: **Failed**
   - any Partial or unclear: **Needs review**
   - all Covered: **Passed**
5. The issuer shortlists or rejects. The AI never decides.

---

## Architecture

```
Browser (Next.js pages)
   |
   |-- /                 Landing page
   |-- /login            Demo login (role: bidder or issuer)
   |-- /tool             Bidder workspace or Issuer workspace (by role)
   |
Next.js API routes
   |-- POST /api/tenders      PDF -> page text -> Gemini extraction -> quote check -> store
   |-- GET  /api/tenders      list tenders
   |-- POST /api/proposals    PDF -> page text -> Gemini check vs tender requirements -> verdict -> store
   |-- GET  /api/proposals    list proposals for a tender
   |-- PATCH /api/proposals   issuer decision (shortlisted, rejected or cleared)
   |-- POST /api/login, /api/logout
   |
Local storage: data/db.json (opportunities, requirements, proposals)
External AI:   Google Gemini API
```

### Project structure

```
app/
  page.tsx                 Landing page
  login/page.tsx           Demo login
  tool/page.tsx            Role gate
  tool/Tool.tsx            Bidder workspace
  tool/Issuer.tsx          Issuer workspace
  api/tenders/route.ts
  api/proposals/route.ts
  api/login/route.ts
  api/logout/route.ts
lib/
  pdf.ts                   PDF text by page
  extract.ts               Gemini call (retry, timeout, model fallback) and tender extraction
  evaluate.ts              Proposal check and verdict rule
  store.ts                 Local JSON storage
data/
  capability_profile.json  Simulated company profile (not yet used by code)
samples/                   Simulated test tender and proposals (add them here)
```

---

## Setup

**Requirements:** Node.js 20 or newer, a Google Gemini API key.

```bash
npm install
```

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
DEMO_PASSWORD=choose_a_demo_password
```

Run:

```bash
npm run dev
```

Open http://localhost:3000.

**On Windows with a slow or unstable connection**, run this in the same terminal first if you see `fetch failed`:

```powershell
$env:NODE_OPTIONS="--dns-result-order=ipv4first"
```

**Reset the demo data:** delete `data/db.json`.

### Using the demo

1. Open the app and click **Sign in**. Choose **Bidder** or **Issuer** and enter the demo password.
2. **Bidder:** upload a text-based tender PDF and review the extracted requirements, page numbers and quote checks.
3. **Issuer:** select an uploaded tender (or upload one), select several proposal PDFs at once, click **Check proposals**, then review verdicts, evidence and summaries, and shortlist or reject.

---

## Sample inputs

All sample material is **simulated**. Names, references, contacts and URLs are fictional and do not refer to any real organisation or live tender.

| Item | Type | Notes |
| --- | --- | --- |
| SIM-TND-2026-006 tender (BI dashboards and data warehouse) | Simulated | Includes a conflicting deadline (28 Nov on page 1, 30 Nov on page 5), a mandatory ISO 27001 certificate, a vendor authorization requirement and no published budget |
| Proposal A (Nairobi DataWorks Ltd) | Simulated | Written to meet all requirements |
| Proposal B (Savanna Analytics Co) | Simulated | Written to lack ISO 27001 and HMIS vendor authorization |
| Proposal C (Lakeview Digital Solutions) | Simulated | Written with partial evidence (two similar projects, authorization pending, shorter bid security validity) |
| `data/capability_profile.json` | Simulated | Placeholder company profile. Certifications and case studies are empty on purpose, so nothing is claimed without evidence |

---

## Testing evidence

Fill in the **Actual result** column from real runs of the prototype. Do not report figures that were not measured.

| Test | Expected | Actual result |
| --- | --- | --- |
| Upload SIM-TND-2026-006 and extract | Requirements listed with page numbers and quotes | |
| Conflicting deadline (page 1 vs page 5) | Conflict flagged, not silently resolved | |
| Proposal A | Passed | |
| Proposal B | Failed (ISO 27001 and HMIS authorization not met) | |
| Proposal C | Needs review | |
| Quote traceability | Every Covered row has a page and a quote found on that page | |
| Time to check one proposal | Measured, in seconds | |
| Extraction accuracy against a hand-made checklist for one tender | Measured, as a count of requirements found out of those expected | |

---

## AI models, services and tools disclosed

- **Google Gemini API** through `@google/generative-ai`. Models are tried in this order, with retries and a timeout: `gemini-flash-lite-latest`, `gemini-flash-latest`, `gemini-3.8-flash`.
- **unpdf** for PDF text extraction by page.
- **zod** is installed as a dependency.
- **Next.js 16**, React and Tailwind CSS for the application.
- `@supabase/supabase-js` and `xlsx` are installed but not used by the current code. They can be removed.
- Simulated sample documents were generated for testing.

---

## Limitations

- Text-based PDFs only. Scanned documents are not supported yet.
- The AI can misread a clause. This is why every item carries evidence and why a person makes every decision.
- The smaller, faster model may be less accurate than a larger one. Verify results on your own documents.
- Storage is a single local JSON file, suitable for one demo user only.
- The login is a demo gate with one shared password. It is not production authentication.
- Very long documents may exceed the model input limit.
- Verdicts depend on the extracted requirements. An extraction error in the tender affects every proposal check.

## Privacy and security

- Only simulated or public data is used. Do not upload confidential or personal documents.
- The API key and demo password live in `.env.local`, which is git-ignored. Never commit them.
- `data/db.json` is git-ignored.
- Uploaded text is sent to the Gemini API for processing. Review Google's terms before using real documents.
- Production use would need real authentication and role permissions, a managed database with an audit log, encryption, and a data-protection review under the Kenya Data Protection Act, 2019.

## Roadmap

1. Capability matching: compare each tender requirement with a company capability profile (Met, Not met, Unclear, Evidence required), with a fit score and an explainable bid or no-bid recommendation.
2. Proposal brief and editable proposal draft, with assumptions and pricing placeholders requiring approval.
3. Pipeline tracking with owners, deadlines and follow-up dates.
4. Form 1 lead import, normalisation and duplicate detection.
5. OCR for scanned PDFs.
6. Tender discovery from permitted public sources.
7. A managed database, real authentication, approvals and decision history.
8. Scoring of financial and technical criteria for issuers, and exportable evaluation reports.

import { generate } from "./extract";

export type Check = {
  requirement_id: string; requirement: string; category: string; tender_page: number;
  status: "Covered" | "Partial" | "Missing";
  page: number | null; quote: string | null; note: string; quote_verified: boolean;
};
export type Summary = {
  approach: string | null; timeline: string | null; price: string | null; team: string | null;
  strengths: string[]; concerns: string[];
};

const CHECKED = ["eligibility", "mandatory_document", "technical"];
const MANDATORY = ["eligibility", "mandatory_document"];

const PROMPT = `You are helping a tender issuer check ONE bidder proposal against the tender requirements.
Rules:
- Use ONLY the proposal text provided. Never assume or infer facts that are not written in it.
- For each numbered requirement return a status:
  "Covered" = the proposal clearly states it is met (and gives the evidence or annex reference where the requirement asks for one),
  "Partial" = only partly met, pending, promised for later, or stated without the evidence required,
  "Missing" = not mentioned, or the proposal states it is not met.
- page is the page number from the [PAGE n] markers where the evidence is, and quote is a VERBATIM quote of at most 25 words from that page. Use null for both when Missing.
- note is one short sentence explaining the status.
- Also summarise the proposal. Use null for anything not stated. Do not invent prices, dates or names.
Return JSON only, in exactly this shape:
{
  "bidder": "company name or null",
  "summary": { "approach": "2-3 sentences", "timeline": "string or null", "price": "string or null", "team": "string or null", "strengths": ["..."], "concerns": ["..."] },
  "checks": [ { "id": 1, "status": "Covered", "page": 1, "quote": "verbatim text", "note": "short reason" } ]
}`;

const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase().trim();
const txt = (v: any): string | null => (v === null || v === undefined || v === "" ? null : String(v));

export function verdict(checks: Check[]): string {
  const m = checks.filter((c) => MANDATORY.includes(c.category));
  if (m.length === 0) return "Needs review";
  if (m.some((c) => c.status === "Missing")) return "Failed";
  if (m.some((c) => c.status !== "Covered")) return "Needs review";
  return "Passed";
}

export async function evaluateProposal(pages: string[], reqs: any[]) {
  const items = reqs.filter((r) => CHECKED.includes(r.category)).slice(0, 40);
  const list = items.map((r, i) => `${i + 1}. [${r.category}] ${r.text}`).join("\n");
  const doc = pages.map((t, i) => `[PAGE ${i + 1}]\n${t}`).join("\n\n");

  let raw = (await generate(`${PROMPT}\n\nREQUIREMENTS:\n${list}\n\nPROPOSAL:\n${doc}`)).trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  let j: any = JSON.parse(raw);
  if (Array.isArray(j)) j = j[0] ?? {};
  const out: any[] = Array.isArray(j.checks) ? j.checks : [];

  const checks: Check[] = items.map((r, i) => {
    const c = out.find((x) => Number(x?.id) === i + 1);
    let status: "Covered" | "Partial" | "Missing" = "Partial";
    let note = "The AI returned no answer for this requirement. Check manually.";
    let page: number | null = null;
    let quote: string | null = null;
    let verified = false;
    if (c) {
      status = ["Covered", "Partial", "Missing"].includes(c.status) ? c.status : "Partial";
      note = String(c.note ?? "");
      page = c.page == null ? null : Number(c.page);
      quote = c.quote ? String(c.quote) : null;
      verified = !!(quote && page && norm(pages[page - 1] ?? "").includes(norm(quote)));
      if (status === "Covered" && !verified) {
        status = "Partial";
        note = (note + " Quote not found on the cited page, needs human check.").trim();
      }
    }
    return {
      requirement_id: r.id, requirement: r.text, category: r.category, tender_page: r.page,
      status, page, quote, note, quote_verified: verified,
    };
  });

  const s = j.summary ?? {};
  const summary: Summary = {
    approach: txt(s.approach), timeline: txt(s.timeline), price: txt(s.price), team: txt(s.team),
    strengths: Array.isArray(s.strengths) ? s.strengths.map(String) : [],
    concerns: Array.isArray(s.concerns) ? s.concerns.map(String) : [],
  };
  return { bidder: txt(j.bidder), summary, checks, verdict: verdict(checks) };
}
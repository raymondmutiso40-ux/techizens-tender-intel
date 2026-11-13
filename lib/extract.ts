import { GoogleGenerativeAI } from "@google/generative-ai";

export type Requirement = {
  category: string; text: string; page: number; quote: string;
};
export type TenderData = {
  title: string | null; organization: string | null; reference: string | null;
  sector: string | null; deadline: string | null; submission_method: string | null;
  requirements: Requirement[];
};

const PROMPT = `You extract structured data from a tender document.
Rules:
- Use ONLY the text provided. Never guess. If a field is missing, return null.
- Every requirement needs the page number (from the [PAGE n] markers) and a VERBATIM quote of at most 25 words from that page.
- If two parts of the document give conflicting values (for example two different deadlines), use the first one and add an extra requirement with category "other" describing the conflict, citing both pages.
- deadline must be ISO 8601 if stated clearly, otherwise null.
- category must be exactly one of: eligibility, mandatory_document, technical, deliverable, commercial, evaluation, other.
- Return JSON only, in exactly this shape:
{
  "title": "string or null",
  "organization": "string or null",
  "reference": "string or null",
  "sector": "string or null",
  "deadline": "string or null",
  "submission_method": "string or null",
  "requirements": [
    { "category": "eligibility", "text": "short description of the requirement", "page": 2, "quote": "verbatim text from the page" }
  ]
}`;

const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.8-flash"];
const CALL_TIMEOUT_MS = 60000;   // give up on one call after 60s
const TOTAL_LIMIT_MS = 150000;   // give up on everything after 2.5 minutes
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generate(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const started = Date.now();
  let lastErr: any;
  for (const name of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() - started > TOTAL_LIMIT_MS)
        throw new Error("The AI took too long to respond (Google may be busy). Please try again in a few minutes. Last error: " + String(lastErr?.message ?? lastErr ?? "none").slice(0, 150));
      const t0 = Date.now();
      try {
        const model = genAI.getGenerativeModel(
          { model: name, generationConfig: { responseMimeType: "application/json", temperature: 0 } },
          { timeout: CALL_TIMEOUT_MS }
        );
        const res = await model.generateContent(prompt);
        console.log(`AI ok: ${name} in ${((Date.now() - t0) / 1000).toFixed(1)}s (total ${((Date.now() - started) / 1000).toFixed(1)}s)`);
        return res.response.text();
      } catch (e: any) {
        lastErr = e;
        const m = String(e?.message ?? e);
        console.log(`AI fail: ${name} attempt ${attempt + 1} after ${((Date.now() - t0) / 1000).toFixed(1)}s: ${(m.match(/\[\d{3}[^\]]*\]/)?.[0] ?? "") + " " + m.slice(-100)}`);
        const retryable = /503|429|high demand|fetch failed|timeout|timed out|abort/i.test(m);
        if (!retryable) break;
        await sleep(1500);
      }
    }
  }
  throw lastErr;
}

function pick(o: any, keys: string[]): any {
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return null;
}

function normCategory(c: any): string {
  const s = String(c ?? "").toLowerCase();
  if (s.includes("elig")) return "eligibility";
  if (s.includes("document") || s.includes("mandatory")) return "mandatory_document";
  if (s.includes("tech")) return "technical";
  if (s.includes("deliver") || s.includes("scope")) return "deliverable";
  if (s.includes("commer") || s.includes("price") || s.includes("payment") || s.includes("financ")) return "commercial";
  if (s.includes("eval") || s.includes("scor")) return "evaluation";
  return "other";
}

function str(v: any): string | null {
  return v === null || v === undefined ? null : String(v);
}

export async function extractTender(pages: string[]): Promise<TenderData> {
  const doc = pages.map((t, i) => `[PAGE ${i + 1}]\n${t}`).join("\n\n");
  let raw = (await generate(`${PROMPT}\n\nDOCUMENT:\n${doc}`)).trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  let j: any = JSON.parse(raw);
  if (Array.isArray(j)) j = j[0] ?? {};

  const list: any[] = pick(j, ["requirements", "Requirements", "items"]) ?? [];
  const requirements: Requirement[] = list
    .map((r: any) => ({
      category: normCategory(pick(r, ["category", "type", "section"])),
      text: String(pick(r, ["text", "requirement", "description", "requirement_text", "summary"]) ?? ""),
      page: Number(pick(r, ["page", "page_number", "pageNumber"]) ?? 0),
      quote: String(pick(r, ["quote", "source_quote", "verbatim_quote", "evidence"]) ?? ""),
    }))
    .filter((r) => r.text.trim().length > 0);

  return {
    title: str(pick(j, ["title", "tender_title", "opportunity_title"])),
    organization: str(pick(j, ["organization", "procuring_entity", "entity"])),
    reference: str(pick(j, ["reference", "tender_reference", "reference_number"])),
    sector: str(pick(j, ["sector"])),
    deadline: str(pick(j, ["deadline", "submission_deadline"])),
    submission_method: str(pick(j, ["submission_method", "submission"])),
    requirements,
  };
}

export function quoteExists(pages: string[], page: number, quote: string) {
  const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase().trim();
  if (!quote) return false;
  return norm(pages[page - 1] ?? "").includes(norm(quote));
}
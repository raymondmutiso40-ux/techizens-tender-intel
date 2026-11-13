import { generate } from "./extract";

export const MANDATORY = ["eligibility", "mandatory_document"];
const WEIGHT: Record<string, number> = { eligibility: 3, mandatory_document: 3, technical: 2, deliverable: 2, commercial: 1, other: 1 };
const POINTS: Record<string, number> = { Met: 1, "Evidence required": 0.5, Unclear: 0.25, "Not met": 0 };
const STATUSES = ["Met", "Not met", "Evidence required", "Unclear"];

const PROMPT = `You compare tender requirements with a company capability profile.
Rules:
- Use ONLY the profile. Never assume a capability, certification, project, partnership, staff member, turnover figure or authorization that the profile does not state.
- status must be exactly one of:
  "Met": the profile clearly states the company satisfies the requirement.
  "Not met": the profile says the company cannot do it, for example it appears under known_gaps or in a service exclusions list.
  "Evidence required": the company seems able to meet it, but a document, certificate, reference letter, financial record or other proof must be supplied that the profile does not contain.
  "Unclear": the profile has no information that bears on the requirement.
- reason: one short sentence that names the profile field used, or says nothing in the profile covers it.
- evidence_needed: what the bidder must provide to prove it, or null.
- profile_ref: the profile field or item that supports the decision, or null.
Return JSON only, in exactly this shape:
{ "results": [ { "id": 1, "status": "Met", "reason": "short reason", "evidence_needed": null, "profile_ref": "services" } ] }`;

export async function matchRequirements(reqs: any[], profile: any) {
  const list = reqs.map((r, i) => `${i + 1}. [${r.category}] ${r.text}`).join("\n");
  let raw = (await generate(`${PROMPT}\n\nCOMPANY PROFILE (JSON):\n${JSON.stringify(profile, null, 2)}\n\nTENDER REQUIREMENTS:\n${list}`)).trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  let j: any = JSON.parse(raw);
  if (Array.isArray(j)) j = { results: j };
  const out: any[] = Array.isArray(j.results) ? j.results : [];
  return reqs.map((r, i) => {
    const c = out.find((x) => Number(x?.id) === i + 1);
    if (!c)
      return { id: r.id, status: "Unclear", reason: "The AI returned no answer for this requirement. Check manually.", evidence_needed: null as string | null, profile_ref: null as string | null };
    return {
      id: r.id,
      status: STATUSES.includes(c.status) ? (c.status as string) : "Unclear",
      reason: String(c.reason ?? ""),
      evidence_needed: c.evidence_needed ? String(c.evidence_needed) : null,
      profile_ref: c.profile_ref ? String(c.profile_ref) : null,
    };
  });
}

export function assess(rows: any[], rules: any, deadline: string | null) {
  const counted = rows.filter((r) => STATUSES.includes(r.status));
  let got = 0, total = 0;
  const counts: Record<string, number> = { Met: 0, "Not met": 0, "Evidence required": 0, Unclear: 0 };
  for (const r of counted) {
    const w = WEIGHT[r.category] ?? 1;
    total += w;
    got += w * POINTS[r.status];
    counts[r.status] += 1;
  }
  const score = total ? Math.round((100 * got) / total) : 0;

  const mandatory = counted.filter((r) => MANDATORY.includes(r.category));
  const gaps = mandatory.filter((r) => r.status === "Not met");
  const open = mandatory.filter((r) => r.status === "Evidence required" || r.status === "Unclear");

  const pursueMin = rules?.min_fit_to_pursue ?? 70;
  const investigateMin = rules?.investigate_range?.[0] ?? 40;

  let recommendation = "Do not pursue";
  if (gaps.length) recommendation = "Do not pursue";
  else if (score >= pursueMin && open.length === 0) recommendation = "Pursue";
  else if (score >= investigateMin) recommendation = "Investigate further";

  const explanation: string[] = [];
  if (gaps.length)
    explanation.push(`${gaps.length} mandatory requirement(s) not met, which could disqualify the bid: ` + gaps.map((g) => g.text.slice(0, 90)).join("; "));
  if (open.length)
    explanation.push(`${open.length} mandatory requirement(s) still need evidence or clarification before a bid.`);
  explanation.push(`Weighted fit score ${score} of 100 (mandatory items count 3, technical and deliverables 2, other 1).`);
  if (!gaps.length && score >= pursueMin && open.length)
    explanation.push("The score is high enough, but open mandatory items keep this at Investigate further.");
  if (gaps.length) explanation.push("A person can still decide to proceed if the gap can be closed before the deadline.");

  const flags: string[] = [];
  if (!deadline) flags.push("Deadline not found in the document");
  else {
    const d = new Date(deadline);
    if (!isNaN(+d)) {
      const days = Math.ceil((+d - Date.now()) / 86400000);
      if (days < 0) flags.push("The deadline has passed");
      else if (days <= 7) flags.push(`Deadline in ${days} day(s)`);
    }
  }
  if (rows.some((r) => r.category === "other" && /conflict|inconsisten|differ/i.test(r.text)))
    flags.push("The tender contains conflicting information. Confirm with the issuer.");

  return { score, recommendation, explanation, flags, counts };
}
import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/store";
import { defaultProfile } from "@/lib/profile";
import { matchRequirements, assess } from "@/lib/match";

export async function POST(req: Request) {
  try {
    const { tender_id } = await req.json();
    const first = await readDb();
    const opp0 = first.opportunities.find((o: any) => o.id === tender_id);
    if (!opp0) return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    const profile = first.profile ?? defaultProfile;
    const toMatch = first.requirements
      .filter((r: any) => r.opportunity_id === tender_id && r.category !== "evaluation")
      .slice(0, 60);
    if (toMatch.length === 0) return NextResponse.json({ error: "No requirements to match" }, { status: 400 });

    const results = await matchRequirements(toMatch, profile);

    const db = await readDb();
    const opp = db.opportunities.find((o: any) => o.id === tender_id);
    for (const m of results) {
      const row = db.requirements.find((r: any) => r.id === m.id);
      if (row) {
        row.status = m.status; row.reason = m.reason;
        row.evidence_needed = m.evidence_needed; row.profile_ref = m.profile_ref;
      }
    }
    const rows = db.requirements.filter((r: any) => r.opportunity_id === tender_id);
    for (const r of rows) if (r.category === "evaluation") r.status = "Info";

    const a = assess(rows, profile.qualification_rules, opp.deadline);
    opp.fit_score = a.score;
    opp.recommendation = a.recommendation;
    opp.explanation = a.explanation;
    opp.flags = a.flags;
    opp.counts = a.counts;
    opp.matched_at = new Date().toISOString();
    opp.stage = "Assessed";
    opp.human_decision = null;
    opp.decided_at = null;
    await writeDb(db);

    return NextResponse.json({ opportunity: opp, requirements: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
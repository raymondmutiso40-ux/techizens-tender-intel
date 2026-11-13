import { NextResponse } from "next/server";
import { readDb } from "@/lib/store";

export async function GET() {
  try {
    const db = await readDb();
    const tenders = db.opportunities.filter((o: any) => o.kind === "tender");
    return NextResponse.json({
      tenders: tenders.length,
      requirements: db.requirements.length,
      assessed: tenders.filter((o: any) => o.matched_at).length,
      proposals: db.proposals.length,
      passed: db.proposals.filter((p: any) => p.verdict === "Passed").length,
      decisions: tenders.filter((o: any) => o.human_decision).length + db.proposals.filter((p: any) => p.decision).length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 401 });
  }
}
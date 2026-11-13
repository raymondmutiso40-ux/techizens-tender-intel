import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/store";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const db = await readDb();
  const opp = db.opportunities.find((o: any) => o.id === id);
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ opportunity: opp, requirements: db.requirements.filter((r: any) => r.opportunity_id === id) });
}

export async function PATCH(req: Request) {
  const { id, decision, owner, note } = await req.json();
  if (![null, "pursue", "investigate", "do_not_pursue"].includes(decision))
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  const db = await readDb();
  const opp = db.opportunities.find((o: any) => o.id === id);
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  opp.human_decision = decision;
  opp.decision_owner = owner || null;
  opp.decision_note = note || null;
  opp.decided_at = decision ? new Date().toISOString() : null;
  opp.human_verified = !!decision;
  if (decision === "pursue") opp.stage = "Qualified";
  else if (decision === "do_not_pursue") opp.stage = "Not qualified";
  else if (decision === "investigate") opp.stage = "Verification required";
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
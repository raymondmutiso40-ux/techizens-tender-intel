import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/store";
import { pdfPages } from "@/lib/pdf";
import { evaluateProposal } from "@/lib/evaluate";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const tenderId = form.get("tender_id") as string | null;
    const file = form.get("file") as File | null;
    if (!tenderId || !file) return NextResponse.json({ error: "Tender and file are required" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json({ error: "File is larger than 4 MB. Use a smaller PDF." }, { status: 413 });

    const reqs = (await readDb()).requirements.filter((r: any) => r.opportunity_id === tenderId);
    if (reqs.length === 0) return NextResponse.json({ error: "This tender has no extracted requirements" }, { status: 400 });

    const pages = await pdfPages(await file.arrayBuffer());
    if (pages.join("").trim().length < 200)
      return NextResponse.json({ error: "No readable text (scanned PDF?)" }, { status: 422 });

    const ev = await evaluateProposal(pages, reqs);
    const proposal = {
      id: randomUUID(), tender_id: tenderId, file_name: file.name, bidder: ev.bidder,
      summary: ev.summary, checks: ev.checks, verdict: ev.verdict,
      decision: null, created_at: new Date().toISOString(),
    };
    const db = await readDb();
    db.proposals.push(proposal);
    await writeDb(db);
    return NextResponse.json({ proposal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const tenderId = new URL(req.url).searchParams.get("tender_id");
  const db = await readDb();
  return NextResponse.json({ proposals: db.proposals.filter((p: any) => p.tender_id === tenderId) });
}

export async function PATCH(req: Request) {
  const { id, decision } = await req.json();
  if (![null, "shortlisted", "rejected"].includes(decision))
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  const db = await readDb();
  const p = db.proposals.find((x: any) => x.id === id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  p.decision = decision;
  p.decided_at = new Date().toISOString();
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
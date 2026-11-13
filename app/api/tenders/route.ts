import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/store";
import { pdfPages } from "@/lib/pdf";
import { extractTender, quoteExists } from "@/lib/extract";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const sourceUrl = (form.get("source_url") as string) || null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024)
      return NextResponse.json({ error: "File is larger than 4 MB. Use a smaller PDF." }, { status: 413 });

    const pages = await pdfPages(await file.arrayBuffer());
    if (pages.join("").trim().length < 200)
      return NextResponse.json({ error: "No readable text (scanned PDF?)" }, { status: 422 });

    const t = await extractTender(pages);
    const id = randomUUID();

    const opp = {
      id, kind: "tender", title: t.title, organization: t.organization,
      reference: t.reference, sector: t.sector, deadline: t.deadline,
      submission_method: t.submission_method, source: file.name, source_url: sourceUrl,
      retrieved_on: new Date().toISOString().slice(0, 10),
      stage: "Verification required", human_verified: false,
      created_at: new Date().toISOString(),
    };
    const reqs = t.requirements.map((r) => {
      const ok = quoteExists(pages, r.page, r.quote);
      return {
        id: randomUUID(), opportunity_id: id, category: r.category, text: r.text,
        page: r.page, quote: r.quote, status: "Unclear",
        label: ok ? "AI-inferred, quote verified" : "AI-inferred, quote NOT found on page",
        confidence: ok ? 0.9 : 0.4,
      };
    });

    const db = await readDb();
    db.opportunities.push({ ...opp, pages });
    db.requirements.push(...reqs);
    await writeDb(db);

    return NextResponse.json({ opportunity: opp, requirements: reqs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}

export async function GET() {
  const db = await readDb();
  const tenders = db.opportunities
    .filter((o: any) => o.kind === "tender")
    .map((o: any) => ({
      id: o.id, title: o.title, reference: o.reference, organization: o.organization, deadline: o.deadline,
      requirement_count: db.requirements.filter((r: any) => r.opportunity_id === o.id).length,
    }));
  return NextResponse.json({ tenders });
}
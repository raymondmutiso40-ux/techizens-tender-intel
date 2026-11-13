import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/store";
import { defaultProfile } from "@/lib/profile";

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ profile: db.profile ?? defaultProfile });
}

export async function PUT(req: Request) {
  const { profile } = await req.json();
  if (!profile || typeof profile !== "object" || !Array.isArray(profile.services))
    return NextResponse.json({ error: "The profile must be a JSON object with a services list" }, { status: 400 });
  const db = await readDb();
  db.profile = profile;
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
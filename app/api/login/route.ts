import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role, password } = await req.json();
  if (!process.env.DEMO_PASSWORD || password !== process.env.DEMO_PASSWORD)
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  if (role !== "bidder" && role !== "issuer")
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("role", role, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createUser } from "@/lib/store";
import { hashPassword, signSession, COOKIE, cookieOpts, emailOk } from "@/lib/auth";

const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const name = String(b.name ?? "").trim().slice(0, 80);
    const email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
    const password = String(b.password ?? "");
    const role = b.role;
    if (name.length < 2) return bad("Enter your name.");
    if (!emailOk(email)) return bad("Enter a valid email address.");
    if (password.length < 8 || password.length > 200) return bad("Use a password of at least 8 characters.");
    if (role !== "bidder" && role !== "issuer") return bad("Choose Bidder or Issuer.");

    const user = { id: randomUUID(), name, email, role, password: hashPassword(password), created_at: new Date().toISOString() };
    const ok = await createUser(user);
    if (!ok) return bad("An account with this email already exists. Sign in instead.", 409);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, signSession({ uid: user.id, role, name, exp: Date.now() + cookieOpts.maxAge * 1000 }), cookieOpts);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
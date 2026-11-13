import { NextResponse } from "next/server";
import { findUser } from "@/lib/store";
import { checkPassword, signSession, COOKIE, cookieOpts } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await findUser(String(email ?? "").trim().toLowerCase());
    if (!user || !checkPassword(String(password ?? ""), user.password))
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, signSession({ uid: user.id, role: user.role, name: user.name, exp: Date.now() + cookieOpts.maxAge * 1000 }), cookieOpts);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("role", "", { path: "/", maxAge: 0 });
  return res;
}
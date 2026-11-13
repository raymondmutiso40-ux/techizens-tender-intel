import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, COOKIE } from "@/lib/auth";
import Tool from "./Tool";
import Issuer from "./Issuer";
import Stats from "./Stats";

async function Gate() {
  const s = verifySession((await cookies()).get(COOKIE)?.value);
  if (!s) redirect("/login");
  const issuer = s.role === "issuer";
  const first = s.name.split(" ")[0];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-bold">Tender <span className="text-emerald-400">Intelligence</span></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-300 sm:inline">{s.name}</span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold capitalize text-emerald-300">{s.role}</span>
            <form action="/api/logout" method="post">
              <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <section className="relative h-60 overflow-hidden bg-slate-900">
        <Image src="/meeting.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 pb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">{issuer ? "Issuer workspace" : "Bidder workspace"}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Welcome back, {first}</h1>
          <p className="mt-2 max-w-xl text-slate-300">
            {issuer
              ? "Check every proposal against the mandatory requirements and see who passed, with evidence."
              : "Check a tender against your company profile and decide whether to bid, with evidence."}
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-6">
        <Stats role={s.role} />
      </div>

      {issuer ? <Issuer /> : <Tool />}
    </div>
  );
}

export default function ToolPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-600">Loading...</p>}>
      <Gate />
    </Suspense>
  );
}
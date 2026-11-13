"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState("bidder");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (window.location.hash === "#signup") setMode("signup"); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    let res: Response;
    try {
      res = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
    } catch {
      setErr("Could not reach the server. Try again.");
      setBusy(false);
      return;
    }
    const j = await res.json().catch(() => ({ error: "Unexpected response from the server" }));
    if (res.ok) window.location.href = "/tool";
    else { setErr(j.error ?? "Something went wrong."); setBusy(false); }
  }

  const field = "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none";
  const Role = ({ v, t, d }: { v: string; t: string; d: string }) => (
    <label className={"block cursor-pointer rounded-lg border p-3 " + (role === v ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-white")}>
      <input type="radio" name="role" checked={role === v} onChange={() => setRole(v)} className="mr-2" />
      <span className="font-semibold text-slate-900">{t}</span>
      <span className="mt-1 block text-xs text-slate-600">{d}</span>
    </label>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <Image src="/meeting.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="text-lg font-bold">Tender <span className="text-emerald-400">Intelligence</span></Link>
          <div>
            <h2 className="max-w-md text-3xl font-bold leading-tight">Make confident tender decisions, backed by evidence.</h2>
            <ul className="mt-5 space-y-2 text-slate-200">
              <li>Every finding links back to the page it came from.</li>
              <li>Uncertainty is flagged, never guessed.</li>
              <li>People make the final call.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-slate-50 p-6">
        <Image src="/meeting.jpg" alt="" fill sizes="100vw" className="object-cover opacity-10 lg:hidden" />
        <form onSubmit={submit} className="relative w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">Back to home</Link>
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <button type="button" onClick={() => { setMode("signin"); setErr(""); }}
              className={"flex-1 rounded-md py-2 " + (mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Sign in</button>
            <button type="button" onClick={() => { setMode("signup"); setErr(""); }}
              className={"flex-1 rounded-md py-2 " + (mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Create account</button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>

          {mode === "signup" && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className={field} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Role v="bidder" t="Bidder" d="Check tenders against your company profile." />
                <Role v="issuer" t="Issuer" d="Review the proposals you received." />
              </div>
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" className={field} />
          <div className="relative">
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder={mode === "signup" ? "Password (at least 8 characters)" : "Password"} className={field} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-sm text-slate-500 hover:text-slate-700">{show ? "Hide" : "Show"}</button>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <p className="text-xs text-slate-500">Use sample or public documents only. Do not upload confidential files.</p>
        </form>
      </div>
    </div>
  );
}
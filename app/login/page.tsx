"use client";
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [role, setRole] = useState("bidder");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password }),
    });
    if (res.ok) window.location.href = "/tool";
    else { setErr((await res.json()).error ?? "Login failed"); setBusy(false); }
  }

  const Option = ({ v, t, d }: { v: string; t: string; d: string }) => (
    <label className={"block cursor-pointer rounded-lg border p-4 " + (role === v ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-white")}>
      <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="mr-2" />
      <span className="font-semibold text-slate-900">{t}</span>
      <span className="mt-1 block text-sm text-slate-600">{d}</span>
    </label>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">Back to home</Link>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-slate-600">Demo access. Choose how you are using the system.</p>
        <Option v="bidder" t="Bidder" d="A company checking tenders against its own capabilities." />
        <Option v="issuer" t="Issuer" d="A tender company reviewing the proposals it received." />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          placeholder="Demo password" className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-xs text-slate-500">Demo login only. It is not production authentication.</p>
      </form>
    </main>
  );
}

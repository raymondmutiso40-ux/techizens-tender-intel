"use client";
import { useState } from "react";

const STEPS = [
  { n: "1", t: "Upload", d: "Any tender PDF" },
  { n: "2", t: "Extract", d: "Requirements with page citations" },
  { n: "3", t: "Match", d: "Against the capability profile" },
  { n: "4", t: "Decide", d: "Human-reviewed bid or no-bid" },
];

export default function Home() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<any>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    setMsg("Reading the tender and extracting requirements. This can take up to a minute...");
    try {
      const res = await fetch("/api/tenders", { method: "POST", body: new FormData(e.currentTarget) });
      const j = await res.json();
      if (res.ok) { setData(j); setMsg(""); } else setMsg("Error: " + j.error);
    } catch (err: any) {
      setMsg("Error: " + err.message);
    }
    setLoading(false);
  }

  const o = data?.opportunity;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm uppercase tracking-widest text-emerald-400">Bidder workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Tender Intelligence</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Upload a tender, see what it requires, and check it against what your company can actually deliver.
            Every fact links back to the source page, and a person makes the final call.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <ol className="grid gap-3 sm:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{s.n}</span>
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="text-sm text-slate-500">{s.d}</p>
            </li>
          ))}
        </ol>

        <form onSubmit={upload} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">New tender</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-emerald-500">
            <span className="font-medium text-slate-700">{fileName || "Click to choose a tender PDF"}</span>
            <span className="text-sm text-slate-500">Text-based PDF (not a scan)</span>
            <input type="file" name="file" accept="application/pdf" required className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </label>
          <input name="source_url" placeholder="Source URL (optional, recorded as evidence)"
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400" />
          <button disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Working..." : "Upload and extract"}
          </button>
          {msg && <p className={msg.startsWith("Error") ? "text-red-600" : "text-slate-600"}>{msg}</p>}
        </form>

        {o && (
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase text-amber-600">{o.stage}</p>
              <h2 className="text-xl font-bold">{o.title ?? "Untitled tender"}</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Procuring entity</dt><dd>{o.organization ?? "Not found in document"}</dd></div>
                <div><dt className="text-slate-500">Reference</dt><dd>{o.reference ?? "Not found in document"}</dd></div>
                <div><dt className="text-slate-500">Deadline</dt><dd>{o.deadline ?? "Not found in document"}</dd></div>
                <div><dt className="text-slate-500">Submission method</dt><dd>{o.submission_method ?? "Not found in document"}</dd></div>
              </dl>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr><th className="p-3">Category</th><th className="p-3">Requirement</th><th className="p-3">Page</th><th className="p-3">Source quote</th><th className="p-3">Check</th></tr>
                </thead>
                <tbody>
                  {data.requirements.map((r: any) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="p-3 capitalize">{r.category.replace("_", " ")}</td>
                      <td className="p-3">{r.text}</td>
                      <td className="p-3">{r.page}</td>
                      <td className="p-3 italic text-slate-600">{r.quote}</td>
                      <td className="p-3">
                        <span className={"rounded-full px-2 py-1 text-xs font-medium " +
                          (r.label.includes("NOT") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                          {r.label.includes("NOT") ? "Quote not found" : "Quote verified"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

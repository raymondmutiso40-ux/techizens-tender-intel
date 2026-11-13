"use client";
import { useEffect, useState } from "react";

type Tender = {
  id: string; title: string | null; reference: string | null; organization: string | null;
  deadline: string | null; requirement_count: number;
};

const verdictStyle: Record<string, string> = {
  Passed: "bg-emerald-100 text-emerald-700",
  "Needs review": "bg-amber-100 text-amber-700",
  Failed: "bg-red-100 text-red-700",
};
const statusStyle: Record<string, string> = {
  Covered: "text-emerald-700", Partial: "text-amber-700", Missing: "text-red-700",
};

export default function Issuer() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tid, setTid] = useState("");
  const [proposals, setProposals] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");

  async function loadTenders(select?: string) {
    const res = await fetch("/api/tenders");
    const j = await res.json().catch(() => ({ error: "Server returned an unexpected response" }));
    const list: Tender[] = j.tenders ?? [];
    setTenders(list);
    if (select) setTid(select);
    else if (list.length) setTid((cur) => cur || list[list.length - 1].id);
  }
  async function loadProposals(id: string) {
    if (!id) { setProposals([]); return; }
    const res = await fetch("/api/proposals?tender_id=" + id);
    const j = await res.json().catch(() => ({ error: "Server returned an unexpected response" }));
    setProposals(j.proposals ?? []);
  }
  useEffect(() => { loadTenders(); }, []);
  useEffect(() => { loadProposals(tid); }, [tid]);

  async function uploadTender(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMsg("Reading the tender. This can take a minute...");
    let res: Response; try { res = await fetch("/api/tenders", { method: "POST", body: new FormData(form) }); } catch { setMsg("Error: could not reach the server. Try again."); setBusy(false); return; }
    const j = await res.json().catch(() => ({ error: "Server returned an unexpected response" }));
    if (res.ok) { setMsg(""); form.reset(); await loadTenders(j.opportunity.id); }
    else setMsg("Error: " + j.error);
    setBusy(false);
  }

  async function uploadProposals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const files = Array.from((form.elements.namedItem("files") as HTMLInputElement).files ?? []);
    if (!tid || files.length === 0) return;
    setBusy(true);
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setMsg(`Checking proposal ${i + 1} of ${files.length}: ${files[i].name} ...`);
      const fd = new FormData();
      fd.append("tender_id", tid);
      fd.append("file", files[i]);
      let res: Response; try { res = await fetch("/api/proposals", { method: "POST", body: fd }); } catch { errors.push(files[i].name + ": could not reach the server. Try again."); continue; }
      const j = await res.json().catch(() => ({ error: "Server returned an unexpected response" }));
      if (!res.ok) errors.push(files[i].name + ": " + j.error);
      await loadProposals(tid);
    }
    setMsg(errors.length ? "Errors: " + errors.join(" | ") : "");
    form.reset();
    setBusy(false);
  }

  async function decide(id: string, decision: string | null) {
    await fetch("/api/proposals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    await loadProposals(tid);
  }

  const tender = tenders.find((t) => t.id === tid);
  const count = (v: string) => proposals.filter((p) => p.verdict === v).length;
  const shown = filter === "All" ? proposals : proposals.filter((p) => p.verdict === filter);
  const passed = proposals.filter((p) => p.verdict === "Passed");
  const mandatory = (p: any) => p.checks.filter((c: any) => c.category === "eligibility" || c.category === "mandatory_document");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 text-slate-900">
      <div>
        <h1 className="text-2xl font-bold">Issuer workspace</h1>
        <p className="mt-1 text-slate-600">
          Upload a tender and the proposals you received. Each proposal is checked against the mandatory requirements, with evidence from the proposal.
          The AI supports your review. You make the final decision.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">1. Tender</h2>
        {tenders.length > 0 && (
          <select value={tid} onChange={(e) => setTid(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900">
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>
                {(t.reference ?? "No reference") + " | " + (t.title ?? "Untitled") + " | " + t.requirement_count + " requirements"}
              </option>
            ))}
          </select>
        )}
        {tender && <p className="text-sm text-slate-600">{tender.organization ?? "Unknown entity"} | Deadline: {tender.deadline ?? "not found"}</p>}
        <form onSubmit={uploadTender} className="flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept="application/pdf" required className="text-sm" />
          <button disabled={busy} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            Upload a new tender
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">2. Proposals received</h2>
        <form onSubmit={uploadProposals} className="flex flex-wrap items-center gap-3">
          <input type="file" name="files" accept="application/pdf" multiple required disabled={!tid} className="text-sm" />
          <button disabled={busy || !tid} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? "Working..." : "Check proposals"}
          </button>
        </form>
        <p className="text-xs text-slate-500">Select several PDFs at once. Text-based PDFs only.</p>
        {msg && <p className={msg.startsWith("Error") ? "text-red-600" : "text-slate-600"}>{msg}</p>}
      </section>

      {proposals.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">3. Results</h2>
          <div className="flex flex-wrap gap-2">
            {["All", "Passed", "Needs review", "Failed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={"rounded-full border px-4 py-1 text-sm " + (filter === f ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700")}>
                {f} ({f === "All" ? proposals.length : count(f)})
              </button>
            ))}
          </div>

          {passed.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <p className="p-4 pb-0 font-semibold">Passed proposals at a glance</p>
              <table className="mt-3 w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr><th className="p-3">Bidder</th><th className="p-3">Price</th><th className="p-3">Timeline</th><th className="p-3">Team</th><th className="p-3">Your decision</th></tr>
                </thead>
                <tbody>
                  {passed.map((p) => (
                    <tr key={p.id} className="border-t align-top">
                      <td className="p-3 font-medium">{p.bidder ?? p.file_name}</td>
                      <td className="p-3">{p.summary.price ?? "Not stated"}</td>
                      <td className="p-3">{p.summary.timeline ?? "Not stated"}</td>
                      <td className="p-3">{p.summary.team ?? "Not stated"}</td>
                      <td className="p-3 capitalize">{p.decision ?? "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {shown.map((p) => {
            const m = mandatory(p);
            const ok = m.filter((c: any) => c.status === "Covered").length;
            return (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{p.bidder ?? p.file_name}</h3>
                    <p className="text-xs text-slate-500">{p.file_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={"rounded-full px-3 py-1 text-xs font-semibold " + verdictStyle[p.verdict]}>{p.verdict}</span>
                    <span className="text-sm text-slate-600">{ok} of {m.length} mandatory covered</span>
                  </div>
                </div>

                {(p.verdict === "Passed" || p.decision === "shortlisted") && (
                  <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
                    <p><b>Approach:</b> {p.summary.approach ?? "Not stated"}</p>
                    <p><b>Timeline:</b> {p.summary.timeline ?? "Not stated"}</p>
                    <p><b>Price:</b> {p.summary.price ?? "Not stated"}</p>
                    <p><b>Team:</b> {p.summary.team ?? "Not stated"}</p>
                    {p.summary.strengths.length > 0 && (
                      <div><b>Strengths:</b><ul className="list-disc pl-5">{p.summary.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                    )}
                    {p.summary.concerns.length > 0 && (
                      <div><b>Concerns:</b><ul className="list-disc pl-5">{p.summary.concerns.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                    )}
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-emerald-700">Requirement-by-requirement evidence</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-left text-slate-600">
                        <tr><th className="p-2">Category</th><th className="p-2">Requirement</th><th className="p-2">Status</th><th className="p-2">Evidence in proposal</th></tr>
                      </thead>
                      <tbody>
                        {p.checks.map((c: any, i: number) => (
                          <tr key={i} className="border-t align-top">
                            <td className="p-2 capitalize">{c.category.replace("_", " ")}</td>
                            <td className="p-2">{c.requirement}</td>
                            <td className={"p-2 font-semibold " + statusStyle[c.status]}>{c.status}</td>
                            <td className="p-2">
                              {c.quote ? <span className="italic text-slate-600">Page {c.page}: {c.quote}</span> : <span className="text-slate-400">No evidence found</span>}
                              {c.note && <span className="mt-1 block text-xs text-slate-500">{c.note}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <button onClick={() => decide(p.id, "shortlisted")} className="rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700">Shortlist</button>
                  <button onClick={() => decide(p.id, "rejected")} className="rounded-lg bg-slate-700 px-3 py-1 font-semibold text-white hover:bg-slate-600">Reject</button>
                  {p.decision && <button onClick={() => decide(p.id, null)} className="rounded-lg border border-slate-300 px-3 py-1 text-slate-700">Clear</button>}
                  <span className="text-slate-600">Decision: <b className="capitalize">{p.decision ?? "pending"}</b></span>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
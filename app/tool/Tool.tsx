"use client";
import { useEffect, useState } from "react";

type Tender = { id: string; title: string | null; reference: string | null; requirement_count: number };

const recStyle: Record<string, string> = {
  Pursue: "bg-emerald-100 text-emerald-700",
  "Investigate further": "bg-amber-100 text-amber-700",
  "Do not pursue": "bg-red-100 text-red-700",
};
const stStyle: Record<string, string> = {
  Met: "bg-emerald-100 text-emerald-700",
  "Not met": "bg-red-100 text-red-700",
  "Evidence required": "bg-amber-100 text-amber-700",
  Unclear: "bg-slate-200 text-slate-700",
  Info: "bg-blue-100 text-blue-700",
};
const decisionLabel: Record<string, string> = { pursue: "Pursue", investigate: "Investigate further", do_not_pursue: "Do not pursue" };

function highlight(text: string, quote: string) {
  const t = text.replace(/\s+/g, " ");
  const q = (quote ?? "").replace(/\s+/g, " ").trim();
  const i = q ? t.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{t}</>;
  return (
    <>
      {t.slice(0, i)}
      <mark className="bg-yellow-200">{t.slice(i, i + q.length)}</mark>
      {t.slice(i + q.length)}
    </>
  );
}

export default function Tool() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tid, setTid] = useState("");
  const [opp, setOpp] = useState<any>(null);
  const [reqs, setReqs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [matching, setMatching] = useState(false);
  const [filter, setFilter] = useState("All");
  const [source, setSource] = useState<{ page: number; quote: string } | null>(null);
  const [profileText, setProfileText] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState("");

  async function loadTenders(select?: string) {
    const res = await fetch("/api/tenders");
    const j = await res.json();
    const list: Tender[] = j.tenders ?? [];
    setTenders(list);
    if (select) setTid(select);
    else if (list.length) setTid((cur) => cur || list[list.length - 1].id);
  }
  async function loadDetail(id: string) {
    if (!id) { setOpp(null); setReqs([]); return; }
    const res = await fetch("/api/tender?id=" + id);
    const j = await res.json();
    if (res.ok) {
      setOpp(j.opportunity); setReqs(j.requirements);
      setOwner(j.opportunity.decision_owner ?? ""); setNote(j.opportunity.decision_note ?? "");
    }
  }
  async function loadProfile() {
    const res = await fetch("/api/profile");
    const j = await res.json();
    setProfileText(JSON.stringify(j.profile, null, 2));
  }
  useEffect(() => { loadTenders(); loadProfile(); }, []);
  useEffect(() => { setFilter("All"); loadDetail(tid); }, [tid]);

  async function uploadTender(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMsg("Reading the tender and extracting requirements. This can take a minute...");
    let res: Response;
    try { res = await fetch("/api/tenders", { method: "POST", body: new FormData(form) }); }
    catch { setMsg("Error: could not reach the server. Try again."); setBusy(false); return; }
    const j = await res.json().catch(() => ({ error: "Unexpected response from the server" }));
    if (res.ok) { setMsg(""); form.reset(); await loadTenders(j.opportunity.id); }
    else setMsg("Error: " + j.error);
    setBusy(false);
  }

  async function runMatch() {
    setMatching(true);
    setMsg("Matching requirements against the company profile...");
    let res: Response;
    try {
      res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tender_id: tid }) });
    } catch { setMsg("Error: could not reach the server. Try again."); setMatching(false); return; }
    const j = await res.json().catch(() => ({ error: "Unexpected response from the server" }));
    if (res.ok) { setOpp(j.opportunity); setReqs(j.requirements); setMsg(""); }
    else setMsg("Error: " + j.error);
    setMatching(false);
  }

  async function saveProfile() {
    let parsed: any;
    try { parsed = JSON.parse(profileText); } catch { setProfileMsg("This is not valid JSON."); return; }
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: parsed }) });
    const j = await res.json();
    setProfileMsg(res.ok ? "Profile saved. Run the match again to apply it." : "Error: " + j.error);
  }

  async function decide(decision: string | null) {
    await fetch("/api/tender", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tid, decision, owner, note }) });
    await loadDetail(tid);
  }

  function downloadCsv() {
    const esc = (v: any) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const head = ["Category", "Requirement", "Status", "Reason", "Evidence needed", "Tender page", "Source quote"];
    const lines = [head.map(esc).join(",")].concat(
      reqs.map((r) => [r.category, r.text, opp?.matched_at ? r.status : "Not matched", r.reason, r.evidence_needed, r.page, r.quote].map(esc).join(","))
    );
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "compliance-matrix.csv";
    a.click();
  }

  const matched = !!opp?.matched_at;
  const shown = filter === "All" ? reqs : reqs.filter((r) => r.status === filter);
  const pageText = source && opp?.pages ? opp.pages[source.page - 1] : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8 text-slate-900">
      <div>
        <h1 className="text-2xl font-bold">Bidder workspace</h1>
        <p className="mt-1 text-slate-600">
          Upload a tender, match it against your company profile, review the compliance matrix and record your bid decision.
          The AI supports your review. You make the final decision.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">1. Tender</h2>
        {tenders.length > 0 && (
          <select value={tid} onChange={(e) => setTid(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900">
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>{(t.reference ?? "No reference") + " | " + (t.title ?? "Untitled") + " | " + t.requirement_count + " requirements"}</option>
            ))}
          </select>
        )}
        <form onSubmit={uploadTender} className="flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept="application/pdf" required className="text-sm" />
          <input name="source_url" placeholder="Source URL (optional)" className="min-w-60 flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder-slate-400" />
          <button disabled={busy} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {busy ? "Working..." : "Upload and extract"}
          </button>
        </form>
        <p className="text-xs text-slate-500">Text-based PDF under 4 MB.</p>
        {msg && <p className={msg.startsWith("Error") ? "text-red-600" : "text-slate-600"}>{msg}</p>}
      </section>

      {opp && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase text-amber-600">{opp.stage}</p>
          <h2 className="text-xl font-bold">{opp.title ?? "Untitled tender"}</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Procuring entity</dt><dd>{opp.organization ?? "Not found in document"}</dd></div>
            <div><dt className="text-slate-500">Reference</dt><dd>{opp.reference ?? "Not found in document"}</dd></div>
            <div><dt className="text-slate-500">Deadline</dt><dd>{opp.deadline ?? "Not found in document"}</dd></div>
            <div><dt className="text-slate-500">Submission method</dt><dd>{opp.submission_method ?? "Not found in document"}</dd></div>
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <details>
          <summary className="cursor-pointer text-lg font-semibold">2. Company profile (simulated, editable)</summary>
          <p className="mt-2 text-sm text-slate-600">
            Matching only uses what is written here. Edit it to describe any company, save, then run the match again.
            Certifications and case studies are empty on purpose, so nothing is claimed without evidence.
          </p>
          <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={14}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900" />
          <div className="mt-2 flex items-center gap-3">
            <button onClick={saveProfile} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Save profile</button>
            {profileMsg && <span className="text-sm text-slate-600">{profileMsg}</span>}
          </div>
        </details>
      </section>

      {opp && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">3. Match and assess</h2>
            <button onClick={runMatch} disabled={matching}
              className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {matching ? "Matching..." : matched ? "Run the match again" : "Match against company profile"}
            </button>
          </div>

          {matched && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className={"rounded-full px-4 py-1 font-semibold " + (recStyle[opp.recommendation] ?? "")}>AI recommendation: {opp.recommendation}</span>
                <span className="text-lg font-bold">Fit score {opp.fit_score} / 100</span>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(opp.explanation ?? []).map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
              {(opp.flags ?? []).length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <b>Flags:</b>
                  <ul className="list-disc pl-5">{opp.flags.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {["All", "Not met", "Evidence required", "Unclear", "Met"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={"rounded-full border px-4 py-1 text-sm " + (filter === f ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-700")}>
                {f}{matched && f !== "All" ? " (" + (opp.counts?.[f] ?? 0) + ")" : ""}
              </button>
            ))}
            <button onClick={downloadCsv} className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">Download compliance matrix (CSV)</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr><th className="p-3">Category</th><th className="p-3">Requirement</th><th className="p-3">Status</th><th className="p-3">Why</th><th className="p-3">Evidence needed</th><th className="p-3">Source</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3 capitalize">{r.category.replace("_", " ")}</td>
                    <td className="p-3">{r.text}</td>
                    <td className="p-3">
                      {matched ? <span className={"rounded-full px-2 py-1 text-xs font-semibold " + (stStyle[r.status] ?? "")}>{r.status}</span>
                        : <span className="text-xs text-slate-400">Not matched yet</span>}
                    </td>
                    <td className="p-3 text-slate-600">{r.reason ?? ""}{r.profile_ref ? <span className="block text-xs text-slate-400">Profile: {r.profile_ref}</span> : null}</td>
                    <td className="p-3 text-slate-600">{r.evidence_needed ?? ""}</td>
                    <td className="p-3">
                      <button onClick={() => setSource({ page: r.page, quote: r.quote })} className="text-emerald-700 underline">Page {r.page}</button>
                      {r.label?.includes("NOT") && <span className="mt-1 block text-xs text-red-600">Quote not found on page</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {matched && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">4. Your decision</h2>
              <p className="text-sm text-slate-600">The recommendation is advice. Record the decision a responsible person has made.</p>
              <div className="flex flex-wrap gap-3">
                <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" className="rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder-slate-400" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or note" className="min-w-60 flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder-slate-400" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button onClick={() => decide("pursue")} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Pursue</button>
                <button onClick={() => decide("investigate")} className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600">Investigate further</button>
                <button onClick={() => decide("do_not_pursue")} className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600">Do not pursue</button>
                {opp.human_decision && <button onClick={() => decide(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700">Clear</button>}
              </div>
              <p className="text-sm text-slate-700">
                Decision: <b>{opp.human_decision ? decisionLabel[opp.human_decision] : "pending"}</b>
                {opp.decision_owner ? " | Owner: " + opp.decision_owner : ""}
                {opp.decided_at ? " | " + new Date(opp.decided_at).toLocaleString() : ""}
              </p>
            </div>
          )}
        </section>
      )}

      {source && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSource(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 text-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tender page {source.page}</h3>
              <button onClick={() => setSource(null)} className="rounded border border-slate-300 px-3 py-1 text-sm">Close</button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {pageText ? highlight(pageText, source.quote) : "Page text is not available for this tender. Upload it again to enable source viewing."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
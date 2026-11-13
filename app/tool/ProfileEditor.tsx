"use client";
import { useEffect, useState } from "react";

const BLANK = {
  company: "", sectors: [], services: [], registrations: [], certifications: [],
  case_studies: [], known_gaps: [], hosting: [], licensing: [], pricing_guardrails: "",
  qualification_rules: { min_fit_to_pursue: 70, investigate_range: [40, 69] },
};

const list = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))) : [];

function normalise(p: any) {
  const q = p?.qualification_rules ?? {};
  return {
    ...p,
    company: p?.company ?? "",
    sectors: list(p?.sectors),
    services: (Array.isArray(p?.services) ? p.services : []).map((s: any) => ({
      ...s,
      name: s?.name ?? "",
      use_cases: list(s?.use_cases),
      tools: list(s?.tools),
      exclusions: list(s?.exclusions),
    })),
    registrations: list(p?.registrations),
    certifications: list(p?.certifications),
    case_studies: list(p?.case_studies),
    known_gaps: list(p?.known_gaps),
    hosting: list(p?.hosting),
    licensing: list(p?.licensing),
    pricing_guardrails: p?.pricing_guardrails ?? "",
    qualification_rules: {
      min_fit_to_pursue: q.min_fit_to_pursue ?? 70,
      investigate_range: q.investigate_range ?? [40, 69],
    },
  };
}

function Chips({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  }
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">
            {v}
            <button type="button" aria-label={"Remove " + v} onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="text-slate-500 hover:text-red-600">x</button>
          </span>
        ))}
        {value.length === 0 && <span className="text-sm text-slate-400">None added</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onBlur={add}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type, then press Enter or Add"}
          className="flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder-slate-400" />
        <button type="button" onClick={add} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Add</button>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 placeholder-slate-400";

export default function ProfileEditor() {
  const [p, setP] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((j) => setP(normalise(j.profile))).catch(() => setMsg("Could not load the profile."));
  }, []);

  if (!p) return <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading company profile...</section>;

  const set = (patch: any) => { setP({ ...p, ...patch }); setMsg(""); };
  const setService = (i: number, patch: any) =>
    set({ services: p.services.map((s: any, j: number) => (j === i ? { ...s, ...patch } : s)) });
  const rules = p.qualification_rules;
  const setRules = (patch: any) => set({ qualification_rules: { ...rules, ...patch } });

  async function save() {
    setSaving(true);
    const pursue = Number(rules.min_fit_to_pursue) || 70;
    const inv = Math.min(Number(rules.investigate_range?.[0]) || 40, pursue);
    const body = { ...p, qualification_rules: { min_fit_to_pursue: pursue, investigate_range: [inv, Math.max(inv, pursue - 1)] } };
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: body }) });
    const j = await res.json().catch(() => ({ error: "Unexpected response from the server" }));
    setMsg(res.ok ? "Saved. Run the match again on your tender to use these changes." : "Error: " + j.error);
    setSaving(false);
  }

  function blank() {
    if (window.confirm("Clear everything and start from a blank profile? Nothing changes until you click Save.")) {
      setP(normalise(BLANK));
      setMsg("");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <details>
        <summary className="cursor-pointer text-lg font-semibold">
          2. Company profile
          <span className="ml-3 text-sm font-normal text-slate-500">
            {p.services.length} services, {p.certifications.length} certifications, {p.known_gaps.length} known gaps
          </span>
        </summary>

        <div className="mt-4 space-y-6">
          <p className="text-sm text-slate-600">
            Tell the system what your company can do. Matching uses only what you write here, and anything you do not list is treated as unknown.
            Only add certifications and projects you can prove with a document.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800">Company name</label>
              <input value={p.company} onChange={(e) => set({ company: e.target.value })} placeholder="Your company name" className={input + " mt-2"} />
            </div>
            <Chips label="Sectors you serve" value={p.sectors} onChange={(v) => set({ sectors: v })} placeholder="For example: Healthcare" />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Services you offer</h3>
            {p.services.map((s: any, i: number) => (
              <div key={i} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-800">Service name</label>
                    <input value={s.name} onChange={(e) => setService(i, { name: e.target.value })} placeholder="For example: Business intelligence" className={input + " mt-2"} />
                  </div>
                  <button type="button" onClick={() => set({ services: p.services.filter((_: any, j: number) => j !== i) })}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Remove service</button>
                </div>
                <Chips label="What this service covers" value={s.use_cases} onChange={(v) => setService(i, { use_cases: v })} placeholder="For example: dashboards" />
                <Chips label="Tools and technologies" value={s.tools} onChange={(v) => setService(i, { tools: v })} placeholder="For example: Power BI" />
                <Chips label="What you do not do" hint="Anything outside this service. A tender asking for it will be marked Not met." value={s.exclusions} onChange={(v) => setService(i, { exclusions: v })} placeholder="For example: hardware supply" />
              </div>
            ))}
            <button type="button" onClick={() => set({ services: [...p.services, { name: "", use_cases: [], tools: [], exclusions: [] }] })}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add a service</button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Proof you can show</h3>
            <Chips label="Registrations and licences" value={p.registrations} onChange={(v) => set({ registrations: v })} placeholder="For example: Registered company in Kenya" />
            <Chips label="Certifications you hold" hint="Leave empty if you hold none. The system then asks for evidence instead of assuming." value={p.certifications} onChange={(v) => set({ certifications: v })} placeholder="For example: ISO 9001" />
            <Chips label="Past projects and references" value={p.case_studies} onChange={(v) => set({ case_studies: v })} placeholder="For example: Hospital data warehouse, 2024" />
          </div>

          <Chips label="Known gaps" hint="Things you cannot do or do not have. A tender that requires one will be marked Not met." value={p.known_gaps} onChange={(v) => set({ known_gaps: v })} placeholder="For example: No ISO 27001 certification" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Chips label="Hosting options" value={p.hosting} onChange={(v) => set({ hosting: v })} placeholder="For example: Client cloud" />
            <Chips label="Licensing models" value={p.licensing} onChange={(v) => set({ licensing: v })} placeholder="For example: Subscription" />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Bid rules</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-800">Recommend Pursue when the fit score is at least</label>
                <input type="number" min={0} max={100} value={rules.min_fit_to_pursue} onChange={(e) => setRules({ min_fit_to_pursue: e.target.value })} className={input + " mt-2"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Recommend Investigate further when it is at least</label>
                <input type="number" min={0} max={100} value={rules.investigate_range?.[0] ?? 40}
                  onChange={(e) => setRules({ investigate_range: [e.target.value, rules.investigate_range?.[1] ?? 69] })} className={input + " mt-2"} />
              </div>
            </div>
            <p className="text-xs text-slate-500">A mandatory requirement marked Not met always leads to Do not pursue, whatever the score.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800">Pricing note</label>
            <textarea value={p.pricing_guardrails} onChange={(e) => set({ pricing_guardrails: e.target.value })} rows={2}
              placeholder="For example: Prices must be approved by the commercial team" className={input + " mt-2"} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save profile"}
            </button>
            <button type="button" onClick={blank} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Start from a blank profile</button>
            {msg && <span className={"text-sm " + (msg.startsWith("Error") ? "text-red-600" : "text-slate-600")}>{msg}</span>}
          </div>
        </div>
      </details>
    </section>
  );
}
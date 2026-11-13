"use client";
import { useEffect, useState } from "react";

export default function Stats({ role }: { role: string }) {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setS).catch(() => {});
  }, []);
  const items: [string, any][] =
    role === "issuer"
      ? [["Tenders loaded", s?.tenders], ["Proposals checked", s?.proposals], ["Passed the requirements", s?.passed], ["Decisions recorded", s?.decisions]]
      : [["Tenders analysed", s?.tenders], ["Requirements extracted", s?.requirements], ["Matched to your profile", s?.assessed], ["Decisions recorded", s?.decisions]];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{value ?? "-"}</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Tool from "./Tool";
import Issuer from "./Issuer";

async function Gate() {
  const role = (await cookies()).get("role")?.value;
  if (!role) redirect("/login");
  return (
    <div>
      <div className="flex items-center justify-between bg-slate-900 px-6 py-3 text-sm text-white">
        <span>Signed in as <b className="capitalize">{role}</b> (demo account)</span>
        <form action="/api/logout" method="post">
          <button className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600">Sign out</button>
        </form>
      </div>
      {role === "issuer" ? <Issuer /> : <Tool />}
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
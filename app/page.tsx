import Image from "next/image";
import Link from "next/link";

const bidderSteps = [
  { n: "1", t: "Upload", d: "Add any tender as a PDF. The source and retrieval date are recorded." },
  { n: "2", t: "Extract", d: "Scope, eligibility, mandatory documents, deadlines and criteria are pulled out, each with its page and quote." },
  { n: "3", t: "Match", d: "Every requirement is checked against your company profile: Met, Not met, Evidence required or Unclear." },
  { n: "4", t: "Decide", d: "See a fit score, a compliance matrix and a recommendation. A person records the final decision." },
];

const issuerSteps = [
  { n: "1", t: "Add the tender", d: "Upload the tender once. Its requirements are extracted with page references." },
  { n: "2", t: "Upload proposals", d: "Add every proposal you received, as many as you need, in one go." },
  { n: "3", t: "See who passed", d: "Each proposal is marked Passed, Needs review or Failed, with evidence quoted from the proposal." },
  { n: "4", t: "Shortlist", d: "Passed proposals are summarised side by side. You shortlist or reject." },
];

const features = [
  { t: "Evidence on every finding", d: "Click any finding to see the exact tender page with the quote highlighted." },
  { t: "Compliance matrix", d: "A requirement-by-requirement table you can filter and download as CSV." },
  { t: "Explainable bid advice", d: "A fit score calculated by clear rules, with the reasons and the gaps listed." },
  { t: "Proposal screening", d: "Check many proposals against the same requirements and read summaries of those that pass." },
];

const trust = [
  { t: "No invented evidence", d: "If a document or profile does not prove it, the system says so. It never makes up certificates, projects or prices." },
  { t: "Uncertainty is visible", d: "Missing, conflicting or unsupported information is flagged instead of guessed." },
  { t: "Humans decide", d: "The AI supports decisions. People approve bids, shortlists and commitments." },
  { t: "Your own profile", d: "Matching uses a company profile you edit, so it works for any company, not one fixed example." },
];

function Steps({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  return (
    <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <li key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">{s.n}</span>
          <h3 className="mt-3 font-semibold">{s.t}</h3>
          <p className="mt-1 text-sm text-slate-600">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="relative min-h-[90vh] overflow-hidden bg-slate-950">
        <Image src="/meeting.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
        <div className="relative mx-auto flex min-h-[90vh] max-w-6xl flex-col px-6">
          <nav className="flex items-center justify-between py-5 text-white">
            <span className="text-lg font-bold">Tender <span className="text-emerald-400">Intelligence</span></span>
            <div className="flex items-center gap-5 text-sm">
              <a href="#how" className="hidden hover:text-emerald-300 sm:inline">How it works</a>
              <a href="#features" className="hidden hover:text-emerald-300 sm:inline">Features</a>
              <a href="#trust" className="hidden hover:text-emerald-300 sm:inline">Why trust it</a>
              <Link href="/login" className="rounded-lg border border-white/40 px-4 py-2 font-semibold hover:bg-white/10">Sign in</Link>
            </div>
          </nav>
          <div className="flex flex-1 flex-col justify-center pb-16">
            <span className="w-fit rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">AI-assisted tender review</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
              Make confident tender decisions, on both sides of the table.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200">
              Bidders find out whether a tender fits before spending weeks on a proposal. Issuers see which proposals meet the
              requirements and read a clear summary of the ones that do. Every finding links back to its source.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login#signup" className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600">Create an account</Link>
              <Link href="/login" className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">Sign in</Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-300">
              <li>Page-level evidence</li>
              <li>Human makes the final decision</li>
              <li>For bidders and issuers</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold">The problem</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold">For bidders</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tenders are long and full of eligibility, technical and commercial conditions. Reading them by hand takes hours, and teams
              often bid on tenders they cannot win or miss a mandatory requirement that disqualifies them.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold">For issuers</h3>
            <p className="mt-2 text-sm text-slate-600">
              A single tender can attract many proposals. Checking each one against every requirement is slow, and reviewers lose time
              on proposals that were never eligible.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl space-y-12 px-6">
          <div>
            <h2 className="text-2xl font-bold">For bidders</h2>
            <Steps steps={bidderSteps} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">For issuers</h2>
            <Steps steps={issuerSteps} />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold">What you get</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-slate-200 p-6">
              <div className="mb-3 h-1 w-10 rounded bg-emerald-500" />
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="trust" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold">Why you can trust it</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {trust.map((p) => (
              <div key={p.t} className="rounded-2xl border border-slate-700 p-6">
                <h3 className="font-semibold text-emerald-400">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-300">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">See it on a sample tender</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Create a free account, upload a tender and get an evidence-backed assessment in about a minute.</p>
        <Link href="/login#signup" className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700">Create an account</Link>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        AI output is decision support, not legal or procurement advice. Use sample or public documents only.
      </footer>
    </div>
  );
}
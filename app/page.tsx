import Link from "next/link";

const bidderSteps = [
  { n: "1", t: "Upload", d: "Add any tender as a PDF. The source and retrieval date are recorded as evidence." },
  { n: "2", t: "Extract", d: "The AI pulls out scope, eligibility, mandatory documents, deadlines and evaluation criteria. Each item links to its page and quote." },
  { n: "3", t: "Match", d: "Each requirement is checked against your company capability profile: Met, Not met, Unclear or Evidence required." },
  { n: "4", t: "Decide", d: "A person reviews the evidence and decides to pursue, investigate further or not bid. Nothing is submitted automatically." },
];

const issuerSteps = [
  { n: "1", t: "Add the tender", d: "Upload the tender once. Its requirements are extracted with page references." },
  { n: "2", t: "Upload proposals", d: "Add every proposal you received, as many as you need, in one go." },
  { n: "3", t: "See who passed", d: "Each proposal is checked against the mandatory requirements and marked Passed, Needs review or Failed, with evidence from the proposal." },
  { n: "4", t: "Review and shortlist", d: "Passed proposals are summarised side by side. You shortlist or reject. The decision is yours." },
];

const principles = [
  { t: "Every fact has a source", d: "Extracted items carry a page number and a quote, and the system checks the quote really appears on that page." },
  { t: "Uncertainty is visible", d: "Missing, conflicting or unsupported information is flagged instead of being guessed." },
  { t: "Humans decide", d: "The AI supports decisions. People approve bids, shortlists and commitments." },
  { t: "No invented evidence", d: "If a document does not prove it, the system says so. It never makes up certificates, experience or prices." },
];

function Steps({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  return (
    <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => (
        <li key={s.n} className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">{s.n}</span>
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
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-bold">Tender <span className="text-emerald-600">Intelligence</span></span>
        <div className="flex items-center gap-4 text-sm">
          <a href="#how" className="hover:text-emerald-700">How it works</a>
          <a href="#trust" className="hover:text-emerald-700">Why trust it</a>
          <Link href="/login" className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">Sign in</Link>
        </div>
      </nav>

      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm uppercase tracking-widest text-emerald-400">AI-assisted tender review</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Make confident tender decisions, on both sides of the table.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Bidders find out whether a tender fits before spending weeks on a proposal. Issuers see which proposals meet the requirements
            and get a clear summary of the ones that do. Every finding links back to its source.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login" className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Open the workspace</Link>
            <a href="#how" className="rounded-lg border border-slate-500 px-6 py-3 font-semibold hover:bg-slate-800">See how it works</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold">The problem</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold">For bidders</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tenders are long and full of eligibility, technical and commercial conditions. Reading them by hand takes hours, and teams
              often bid on tenders they cannot win or miss a mandatory requirement that disqualifies them.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-6">
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

      <section id="trust" className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold">Why you can trust it</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.t} className="rounded-xl border border-slate-700 p-5">
                <h3 className="font-semibold text-emerald-400">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-300">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        AI output is decision support, not legal or procurement advice. Demo data is simulated.
      </footer>
    </div>
  );
}
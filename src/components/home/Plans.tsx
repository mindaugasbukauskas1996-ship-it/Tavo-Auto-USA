import Link from "next/link";
import type { Plan } from "@/lib/catalog.ts";
import { IconCheck } from "../icons.tsx";

const eur = (n: number) => new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(n) + " €";
const usd = (n: number) => new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(n) + " $";
const bidsWord = (n: number) => (n === 1 ? "aktyvus statymas" : n < 10 ? "aktyvūs statymai" : "aktyvių statymų");

export default function Plans({ plans }: { plans: Plan[] }) {
  if (!plans.length) return null;
  return (
    <section id="planai" className="section scroll-mt-28" style={{ background: "var(--accent-soft)" }}>
      <div className="container-x">
        <h2 className="h2 text-center">Aukciono užstato planai</h2>
        <p className="muted mx-auto mt-3 max-w-xl text-center">
          Pasirinkite užstatą pagal planuojamą statymą. Užstatas nėra mokestis — laimėjus jis įskaičiuojamas į kainą,
          nelaimėjus grąžinamas.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className={`relative rounded-xl border p-6 ${p.popular ? "border-transparent text-white shadow-xl" : "border-line bg-white"}`}
              style={p.popular ? { background: "var(--accent)" } : undefined}>
              {p.popular && <span className="badge absolute right-4 top-4" style={{ color: "var(--accent)" }}>Populiariausias</span>}
              <h3 className="text-xl">{p.name}</h3>
              <p className={`mt-1 text-lg font-semibold ${p.popular ? "" : "link"}`}>Užstatas: {eur(p.deposit_eur)}</p>
              <Link href="/prisijungti?rezimas=registracija"
                className={`mt-5 w-full ${p.popular ? "btn-outline" : "btn"}`} style={p.popular ? { borderColor: "#fff" } : undefined}>
                Pasirinkti planą
              </Link>
              <ul className="mt-5 space-y-2.5 text-sm">
                <li className="flex items-center gap-2"><IconCheck size={18} /> Maksimalus statymas: iki {usd(p.max_bid_usd)}</li>
                <li className="flex items-center gap-2"><IconCheck size={18} /> {p.active_bids} {bidsWord(p.active_bids)}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

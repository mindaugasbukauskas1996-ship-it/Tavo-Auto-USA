import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchLots } from "@/lib/catalog.ts";
import LotCard from "@/components/LotCard.tsx";

export const metadata: Metadata = {
  title: "Copart ir IAAI katalogas — Tavo auto USA",
  description: "Aktyvūs JAV Copart ir IAAI aukcionų automobiliai su importo į Klaipėdą kaina.",
};

const FIELDS = ["platform", "make", "model", "year_from", "year_to", "price_max", "lot_status", "s"] as const;
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function Filters({ sp }: { sp: SP }) {
  return (
    <form className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4" action="/katalogas">
      <div className="sm:col-span-2">
        <label htmlFor="s" className="label">VIN arba loto numeris</label>
        <input id="s" name="s" defaultValue={one(sp.s)} className="field mt-2" placeholder="pvz. WBA3A5G52ENP33263" />
      </div>
      <div>
        <label htmlFor="platform" className="label">Aukcionas</label>
        <select id="platform" name="platform" defaultValue={one(sp.platform)} className="field mt-2">
          <option value="">Visi</option>
          <option value="copart">Copart</option>
          <option value="iaai">IAAI</option>
        </select>
      </div>
      <div>
        <label htmlFor="lot_status" className="label">Pardavimo būdas</label>
        <select id="lot_status" name="lot_status" defaultValue={one(sp.lot_status)} className="field mt-2">
          <option value="">Visi</option>
          <option value="Buy Now">Tik „Pirkti dabar“</option>
        </select>
      </div>
      <div>
        <label htmlFor="make" className="label">Markė</label>
        <input id="make" name="make" defaultValue={one(sp.make)} className="field mt-2" placeholder="pvz. BMW" />
      </div>
      <div>
        <label htmlFor="model" className="label">Modelis</label>
        <input id="model" name="model" defaultValue={one(sp.model)} className="field mt-2" placeholder="pvz. X5" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="year_from" className="label">Metai nuo</label>
          <input id="year_from" name="year_from" inputMode="numeric" defaultValue={one(sp.year_from)} className="field mt-2" />
        </div>
        <div>
          <label htmlFor="year_to" className="label">iki</label>
          <input id="year_to" name="year_to" inputMode="numeric" defaultValue={one(sp.year_to)} className="field mt-2" />
        </div>
      </div>
      <div>
        <label htmlFor="price_max" className="label">Kaina iki, $</label>
        <input id="price_max" name="price_max" inputMode="numeric" defaultValue={one(sp.price_max)} className="field mt-2" />
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
        <button className="btn">Ieškoti</button>
        <Link href="/katalogas" className="muted text-sm underline">Išvalyti</Link>
      </div>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const params: Record<string, string> = {};
  for (const f of FIELDS) if (one(sp[f])) params[f] = one(sp[f]);
  const res = await searchLots(params, one(sp.cursor));

  const nextHref = () => {
    const q = new URLSearchParams(params);
    if (res.next_cursor) q.set("cursor", res.next_cursor);
    return `/katalogas?${q}`;
  };

  return (
    <>
      <Filters sp={sp} />
      {res.error && (
        <p className="warn mt-6 text-sm">
          {res.error.includes("limit") || res.error.includes("kvota")
            ? "Šiuo metu katalogas laikinai nepasiekiamas — bandykite po kelių minučių."
            : "Nepavyko įkelti automobilių. Bandykite dar kartą."}
        </p>
      )}
      {!res.error && res.lots.length === 0 && <p className="muted mt-10 text-center">Pagal šiuos filtrus automobilių nerasta.</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {res.lots.map((l) => <LotCard key={l.id} lot={l} />)}
      </div>
      {res.has_more && res.next_cursor && (
        <div className="mt-8 text-center">
          <Link href={nextHref()} className="btn inline-block">Daugiau automobilių →</Link>
        </div>
      )}
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/katalogas">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Copart ir IAAI automobiliai</h1>
      <Suspense fallback={<p className="muted">Kraunami automobiliai…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

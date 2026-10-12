import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchLots } from "@/lib/catalog.ts";
import { MAKES, YEARS } from "@/lib/makes.ts";
import LotRow from "@/components/LotRow.tsx";
import { IconFilter, IconSearch } from "@/components/icons.tsx";

export const metadata: Metadata = {
  title: "Aukcionai — Tavo auto USA",
  description: "Aktyvūs JAV Copart ir IAAI aukcionų automobiliai su importo į Klaipėdą kaina.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

// URL raktai, kuriuos išsaugome tarp skirtukų ir puslapių
const KEYS = ["cp", "ia", "make", "model", "year_from", "year_to", "price_min", "price_max", "km_from", "km_to", "run_cond", "fuel_type", "transmission", "s"] as const;

const TABS = [
  { id: "", label: "Visi aukcionai" },
  { id: "pirk-dabar", label: "Pirk dabar" },
  { id: "vyksta", label: "Prasidėję aukcionai" },
  { id: "ivyke", label: "Įvykę aukcionai" },
] as const;

function currentTab(sp: SP) {
  const r = one(sp.rodinys);
  if (r) return r;
  if (one(sp.lot_status) === "Buy Now" || one(sp.buy_now)) return "pirk-dabar";
  if (one(sp.ended)) return "ivyke";
  return "";
}

/** URL filtrai → Apibara parametrai. Rida įvedama km, API laukia mylių. */
function toApiParams(sp: SP): Record<string, string> {
  const p: Record<string, string> = {};
  const cp = one(sp.cp), ia = one(sp.ia);
  if (cp && !ia) p.platform = "copart";
  if (ia && !cp) p.platform = "iaai";
  for (const k of ["make", "model", "year_from", "year_to", "price_min", "price_max", "run_cond", "fuel_type", "transmission", "s"] as const) {
    if (one(sp[k])) p[k] = one(sp[k]);
  }
  const mi = (km: string) => String(Math.round(Number(km) / 1.609344));
  if (Number(one(sp.km_from)) > 0) p.odometer_from = mi(one(sp.km_from));
  if (Number(one(sp.km_to)) > 0) p.odometer_to = mi(one(sp.km_to));
  const tab = currentTab(sp);
  if (tab === "pirk-dabar") p.lot_status = "Buy Now";
  if (tab === "vyksta") p.lot_sub_status = "Live";
  if (tab === "ivyke") p.lot_sub_status = "Ended";
  return p;
}

function hrefWith(sp: SP, patch: Record<string, string>) {
  const q = new URLSearchParams();
  for (const k of KEYS) if (one(sp[k])) q.set(k, one(sp[k]));
  const tab = currentTab(sp);
  if (tab) q.set("rodinys", tab);
  for (const [k, v] of Object.entries(patch)) {
    if (v) q.set(k, v);
    else q.delete(k);
  }
  const s = q.toString();
  return `/katalogas${s ? `?${s}` : ""}`;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-4">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Radio({ name, value, label, current }: { name: string; value: string; label: string; current: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
      <input type="radio" name={name} value={value} defaultChecked={current === value} className="accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function Sidebar({ sp }: { sp: SP }) {
  const noPlatform = !one(sp.cp) && !one(sp.ia);
  return (
    <form action="/katalogas" className="space-y-4 rounded-xl border border-line bg-white p-4">
      {currentTab(sp) && <input type="hidden" name="rodinys" value={currentTab(sp)} />}
      {one(sp.s) && <input type="hidden" name="s" value={one(sp.s)} />}
      <FilterGroup title="Aukcionas">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="cp" value="1" defaultChecked={noPlatform || !!one(sp.cp)} className="accent-[var(--accent)]" /> Copart</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ia" value="1" defaultChecked={noPlatform || !!one(sp.ia)} className="accent-[var(--accent)]" /> IAAI</label>
        </div>
      </FilterGroup>
      <FilterGroup title="Gamintojas">
        <label htmlFor="f-make" className="sr-only">Gamintojas</label>
        <select id="f-make" name="make" defaultValue={one(sp.make)} className="field">
          <option value="">Pasirinkite gamintoją</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label htmlFor="f-model" className="sr-only">Modelis</label>
        <input id="f-model" name="model" defaultValue={one(sp.model)} placeholder="Modelis" className="field mt-2" />
      </FilterGroup>
      <FilterGroup title="Kaina, $">
        <div className="grid grid-cols-2 gap-2">
          <input name="price_min" inputMode="numeric" aria-label="Kaina nuo" placeholder="Nuo" defaultValue={one(sp.price_min)} className="field" />
          <input name="price_max" inputMode="numeric" aria-label="Kaina iki" placeholder="Iki" defaultValue={one(sp.price_max)} className="field" />
        </div>
      </FilterGroup>
      <FilterGroup title="Metai">
        <div className="grid grid-cols-2 gap-2">
          <select name="year_from" aria-label="Metai nuo" defaultValue={one(sp.year_from)} className="field">
            <option value="">Nuo</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="year_to" aria-label="Metai iki" defaultValue={one(sp.year_to)} className="field">
            <option value="">Iki</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </FilterGroup>
      <FilterGroup title="Rida, km">
        <div className="grid grid-cols-2 gap-2">
          <input name="km_from" inputMode="numeric" aria-label="Rida nuo" placeholder="Nuo" defaultValue={one(sp.km_from)} className="field" />
          <input name="km_to" inputMode="numeric" aria-label="Rida iki" placeholder="Iki" defaultValue={one(sp.km_to)} className="field" />
        </div>
      </FilterGroup>
      <FilterGroup title="Variklio būsena">
        <Radio name="run_cond" value="" label="Visi" current={one(sp.run_cond)} />
        <Radio name="run_cond" value="RUNS AND DRIVES" label="Vedasi, važiuoja" current={one(sp.run_cond)} />
        <Radio name="run_cond" value="ENGINE START PROGRAM" label="Užsiveda" current={one(sp.run_cond)} />
        <Radio name="run_cond" value="STATIONARY" label="Nesiveda" current={one(sp.run_cond)} />
      </FilterGroup>
      <FilterGroup title="Kuro tipas">
        <Radio name="fuel_type" value="" label="Visi" current={one(sp.fuel_type)} />
        <Radio name="fuel_type" value="Gasoline" label="Benzinas" current={one(sp.fuel_type)} />
        <Radio name="fuel_type" value="Diesel" label="Dyzelinas" current={one(sp.fuel_type)} />
        <Radio name="fuel_type" value="Hybrid" label="Hibridinis" current={one(sp.fuel_type)} />
        <Radio name="fuel_type" value="Electric" label="Elektra" current={one(sp.fuel_type)} />
      </FilterGroup>
      <FilterGroup title="Pavarų dėžė">
        <Radio name="transmission" value="" label="Visos" current={one(sp.transmission)} />
        <Radio name="transmission" value="Automatic" label="Automatinė" current={one(sp.transmission)} />
        <Radio name="transmission" value="Manual" label="Mechaninė" current={one(sp.transmission)} />
      </FilterGroup>
      <button className="btn w-full">Filtruoti</button>
      <Link href="/katalogas" className="block text-center text-sm text-muted hover:text-accent">Išvalyti filtrus</Link>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const res = await searchLots(toApiParams(sp), one(sp.cursor));
  const tab = currentTab(sp);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside>
        <details className="group lg:hidden">
          <summary className="btn-outline w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <IconFilter size={18} /> Filtrai
          </summary>
          <div className="mt-3"><Sidebar sp={sp} /></div>
        </details>
        <div className="hidden lg:block"><Sidebar sp={sp} /></div>
      </aside>

      <div className="min-w-0">
        <form action="/katalogas" className="flex gap-2 rounded-xl border border-line bg-white p-3">
          <label htmlFor="cat-s" className="sr-only">VIN arba loto numeris</label>
          <input id="cat-s" name="s" defaultValue={one(sp.s)} placeholder="VIN arba loto numeris" className="field" />
          <button className="btn shrink-0"><IconSearch size={18} /> Ieškoti</button>
        </form>

        <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-line" aria-label="Aukcionų rodinys">
          {TABS.map((t) => (
            <Link key={t.id} href={hrefWith(sp, { rodinys: t.id, cursor: "" })}
              className={`tab whitespace-nowrap ${tab === t.id ? "tab-on" : ""}`}>
              {t.label}
            </Link>
          ))}
        </nav>

        {res.error && (
          <p className="warn mt-6 text-sm">
            {/limit|kvota/i.test(res.error)
              ? "Šiuo metu katalogas laikinai nepasiekiamas — bandykite po kelių minučių."
              : "Nepavyko įkelti automobilių. Bandykite dar kartą."}
          </p>
        )}
        {!res.error && res.lots.length === 0 && <p className="muted mt-12 text-center">Pagal šiuos filtrus automobilių nerasta.</p>}

        <div className="mt-5 space-y-4">
          {res.lots.map((l) => <LotRow key={l.id} lot={l} />)}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {one(sp.cursor) && <Link href={hrefWith(sp, { cursor: "" })} className="btn-outline">← Į pradžią</Link>}
          {res.has_more && res.next_cursor && <Link href={hrefWith(sp, { cursor: res.next_cursor })} className="btn">Daugiau automobilių →</Link>}
        </div>
      </div>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/katalogas">) {
  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-8">
        <nav className="muted mb-4 text-sm" aria-label="Kelias"><Link href="/" className="hover:text-accent">Pradžia</Link> / Aukcionai</nav>
        <Suspense fallback={<p className="muted">Kraunami automobiliai…</p>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

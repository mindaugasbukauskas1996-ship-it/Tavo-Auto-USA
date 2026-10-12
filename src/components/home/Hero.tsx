import Link from "next/link";
import { MAKES, YEARS } from "@/lib/makes.ts";
import { IconCalc, IconFilter, IconHelp, IconSearch } from "../icons.tsx";

function Toggle({ name, label, defaultChecked = false, color }: { name: string; label: string; defaultChecked?: boolean; color?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="toggle" style={color ? ({ "--accent": color } as React.CSSProperties) : undefined} />
      {label}
    </label>
  );
}

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(1200px 500px at 80% -10%, rgba(0,114,238,.45), transparent 60%), radial-gradient(800px 400px at 0% 110%, rgba(0,114,238,.25), transparent 60%), linear-gradient(160deg, #0d1b2e 0%, #1f1f1f 70%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[.07]"
        style={{ backgroundImage: "repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 28px)" }} />
      <div className="container-x relative py-14 sm:py-20">
        <h1 className="mx-auto max-w-4xl text-center text-[34px] font-normal leading-tight sm:text-5xl lg:text-[56px]">
          Automobiliai iš JAV aukcionų —<br className="hidden sm:block" /> su pristatymu į Klaipėdą
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[15px] text-white/80 sm:text-base">
          Copart ir IAAI pasiūlymai vienoje vietoje. Iš karto matote galutinę kainą su transportu, muitu ir PVM,
          o statymą už jus atliekame mes.
        </p>

        <form action="/katalogas" className="mx-auto mt-10 max-w-5xl rounded-2xl bg-white p-4 text-[var(--ink)] shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
            <div className="flex">
              <span className="tab tab-on">Automobiliai</span>
              <Link href="/katalogas?lot_status=Buy+Now" className="tab">Pirk dabar</Link>
            </div>
            <div className="flex items-center gap-4 pb-2">
              <Toggle name="cp" label="Copart" defaultChecked color="var(--copart)" />
              <Toggle name="ia" label="IAAI" defaultChecked color="var(--iaai)" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.8fr_.8fr_1.2fr_auto]">
            <div>
              <label htmlFor="h-make" className="sr-only">Markė</label>
              <select id="h-make" name="make" className="field" defaultValue="">
                <option value="">Markė</option>
                {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-model" className="sr-only">Modelis</label>
              <input id="h-model" name="model" placeholder="Modelis" className="field" />
            </div>
            <div>
              <label htmlFor="h-yf" className="sr-only">Metai nuo</label>
              <select id="h-yf" name="year_from" className="field" defaultValue="">
                <option value="">Metai nuo</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-yt" className="sr-only">Metai iki</label>
              <select id="h-yt" name="year_to" className="field" defaultValue="">
                <option value="">Metai iki</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="h-s" className="sr-only">VIN arba loto numeris</label>
              <input id="h-s" name="s" placeholder="VIN arba loto numeris" className="field" />
            </div>
            <button className="btn h-full min-h-[44px]"><IconSearch size={18} /> Paieška</button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap gap-5">
              <Link href="/katalogas" className="flex items-center gap-1.5 text-muted hover:text-accent"><IconFilter size={16} /> Išplėstinis filtras</Link>
              <Link href="#skaiciuokle" className="flex items-center gap-1.5 text-muted hover:text-accent"><IconCalc size={16} /> Skaičiuoklė</Link>
              <Link href="#duk" className="flex items-center gap-1.5 text-muted hover:text-accent"><IconHelp size={16} /> Reikia pagalbos?</Link>
            </div>
            <div className="flex gap-5">
              <Toggle name="buy_now" label="Pirk dabar" />
              <Toggle name="ended" label="Rodyti įvykusius" />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

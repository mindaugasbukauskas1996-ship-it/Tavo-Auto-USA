import { SITE, telHref } from "@/lib/site.ts";
import { IconDoc, IconGavel, IconHome, IconMail, IconPhone, IconSearch, IconShip, IconWallet } from "../icons.tsx";

const STEPS = [
  { icon: IconSearch, title: "Automobilio paieška", text: "Kataloge raskite automobilį iš Copart ar IAAI aukcionų. Prie kiekvieno matote nuotraukas, pažeidimus, dokumentus ir galutinę kainą Klaipėdoje." },
  { icon: IconWallet, title: "Užstatas", text: "Pasirinkite užstato planą ir jį sumokėkite. Užstatas grąžinamas, jei aukciono nelaimite." },
  { icon: IconGavel, title: "Statymas", text: "Nurodote maksimalią kainą — aukcione statome už jus ir neviršijame jūsų sumos. Rezultatą pranešame iškart." },
  { icon: IconShip, title: "Logistika", text: "Laimėjus pasirūpiname apmokėjimu aukcionui, transportu iki uosto JAV ir jūra iki Klaipėdos." },
  { icon: IconDoc, title: "Muitinė", text: "Sutvarkome muitinės deklaraciją, sumokame muitą ir PVM — jūs gaunate visus dokumentus registracijai." },
  { icon: IconHome, title: "Atsiėmimas", text: "Automobilį atsiimate Klaipėdoje arba užsakote pristatymą iki namų (papildoma paslauga)." },
];

export const FAQ = [
  { q: "Kaip vyksta statymas aukcione?", a: "Automobilio puslapyje nurodote maksimalią sumą, kurią esate pasiruošę mokėti aukcione. Statymą aukcione atliekame mes, neviršydami jūsų nurodytos sumos. Apie rezultatą pranešame iškart po aukciono." },
  { q: "Kam reikalingas užstatas ir ar jis grąžinamas?", a: "Užstatas patvirtina, kad statymas rimtas, ir nustato, už kokią didžiausią sumą galite statyti. Jei aukciono nelaimite, užstatas grąžinamas arba lieka jūsų sąskaitoje kitiems statymams." },
  { q: "Ar galiu atsisakyti pirkimo, jei aukcioną laimėjau?", a: "Laimėtas statymas yra įpareigojantis — aukciono namai reikalauja automobilį apmokėti per kelias darbo dienas. Atsisakius pirkimo aukciono taikomos baudos dengiamos iš užstato." },
  { q: "Ką reiškia dokumento tipas (Clean, Salvage ir kt.)?", a: "Tai JAV nuosavybės dokumento būklė. „Clean“ — automobilis nebuvo pripažintas nuostolingu, „Salvage“ — draudimas jį pripažino nuostolingu. Kai kurie dokumentai netinka eksportui — tokius automobilius pažymime ir patariame prieš statant." },
  { q: "Kas yra „Pirk dabar“?", a: "Kai kurie automobiliai parduodami fiksuota kaina be aukciono. Tokį automobilį galima įsigyti iškart, kol jo nenupirko kitas pirkėjas." },
  { q: "Kiek laiko trunka pristatymas į Klaipėdą?", a: "Dažniausiai 6–10 savaičių nuo apmokėjimo: transportas iki uosto JAV užtrunka 1–2 savaites, jūra — 4–7 savaites, muitinės formalumai — kelias dienas." },
  { q: "Kas įeina į skaičiuoklės kainą?", a: "Aukciono kaina, aukciono mokestis, transportas JAV iki uosto, jūra iki Klaipėdos, muitas, PVM, deklaravimas, uosto mokesčiai ir mūsų paslaugos mokestis. Kaina orientacinė — galutinę sumą lemia muitinės sprendimas ir valiutos kursas." },
];

export default function HowItWorks() {
  return (
    <section id="kaip-tai-veikia" className="section scroll-mt-28">
      <div className="container-x grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="h2">Kaip viskas veikia?</h2>
          <p className="muted mt-3">Automobilio pirkimas iš JAV be kelionių ir be rūpesčių:</p>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[15px]">
            <li>Išsirinkite automobilį iš Copart ar IAAI aukcionų.</li>
            <li>Sumokėkite grąžinamą užstatą ir nurodykite maksimalią kainą.</li>
            <li>Toliau viskas mūsų rūpestis — nuo statymo iki pristatymo į Klaipėdą.</li>
          </ol>

          <h3 id="duk" className="mt-10 scroll-mt-28 text-xl font-semibold">Dažniausiai užduodami klausimai</h3>
          <div className="mt-4 space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-lg border border-line bg-white open:border-accent">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[15px] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="muted px-4 pb-4 text-[15px] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          {(SITE.phone || SITE.email) && (
            <div className="mt-6 text-sm">
              <p className="muted">Neradote atsakymo? Susisiekite:</p>
              <div className="mt-2 flex flex-wrap gap-5">
                {SITE.phone && <a href={telHref(SITE.phone)} className="link flex items-center gap-1.5"><IconPhone size={16} /> {SITE.phone}</a>}
                {SITE.email && <a href={`mailto:${SITE.email}`} className="link flex items-center gap-1.5"><IconMail size={16} /> {SITE.email}</a>}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 text-white sm:p-8" style={{ background: "linear-gradient(160deg, #0b3a8c 0%, #0072ee 100%)" }}>
          <h3 className="text-xl font-semibold">Kaip tai veikia?</h3>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[var(--accent)]">
                  <s.icon size={20} />
                </span>
                <div>
                  <p className="font-semibold">{i + 1}. {s.title}</p>
                  <p className="mt-1 text-sm text-white/85">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

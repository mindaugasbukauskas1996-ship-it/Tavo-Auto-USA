import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser, supabaseServer } from "@/lib/supabase/server.ts";
import { signOut } from "@/app/prisijungti/actions.ts";
import { DutyEditor, FeeEditor, PlansEditor, SeaEditor, SettingsEditor } from "./Editors.tsx";
import type { FeeRow } from "./actions.ts";

export const metadata: Metadata = { title: "Tarifai — administravimas" };

const TABLE_LT: Record<string, string> = {
  settings: "Nustatymai", duty_rates: "Muitas", sea_rates: "Jūra",
  auction_fee_brackets: "Aukciono mokesčiai", towing_routes: "Transportas JAV", deposit_plans: "Užstato planai",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="muted mt-1 text-sm">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function AdminContent() {
  const user = await currentUser();
  if (!user) redirect("/prisijungti?next=/admin/tarifai");
  if (!user.isAdmin) {
    return (
      <div className="card">
        <p>Prisijungta kaip <b>{user.email}</b>, bet ši paskyra neturi administratoriaus teisių.</p>
      </div>
    );
  }

  const db = await supabaseServer();
  const [settings, duty, fees, sea, ports, history, plans] = await Promise.all([
    db.from("settings").select("key,label,unit,value").order("key"),
    db.from("duty_rates").select("vehicle_type,label,pct"),
    db.from("auction_fee_brackets").select("auction,from_usd,to_usd,fee_usd,pct").order("from_usd"),
    db.from("sea_rates").select("port_code,size_class,price_usd"),
    db.from("ports").select("code,name").order("sort"),
    db.from("tariff_history").select("id,table_name,op,changed_at").order("changed_at", { ascending: false }).limit(15),
    db.from("deposit_plans").select("*").order("sort"),
  ]);

  const order = ["usd_to_eur", "fx_buffer_pct", "vat_pct", "declaration_eur", "port_fees_eur", "unloading_eur", "broker_fee_eur"];
  const settingRows = (settings.data ?? [])
    .map((r) => ({ key: r.key, label: r.label, unit: r.unit, value: Number(r.value) }))
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  const feeRows = (a: string): FeeRow[] =>
    (fees.data ?? []).filter((f) => f.auction === a).map((f) => ({
      fromUsd: String(Number(f.from_usd)),
      toUsd: f.to_usd === null ? "" : String(Number(f.to_usd)),
      feeUsd: String(Number(f.fee_usd)),
      pct: Number(f.pct) ? String(+(Number(f.pct) * 100).toFixed(4)) : "",
    }));

  const seaMap: Record<string, Record<string, number>> = {};
  for (const r of sea.data ?? []) (seaMap[r.port_code] ??= {})[r.size_class] = Number(r.price_usd);

  const dutyOrder = ["car", "moto", "truck", "classic"];
  const dutyRows = (duty.data ?? [])
    .map((d) => ({ type: d.vehicle_type, label: d.label, pct: d.pct === null ? null : Number(d.pct) }))
    .sort((a, b) => dutyOrder.indexOf(a.type) - dutyOrder.indexOf(b.type));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="muted text-sm">Prisijungta: {user.email}</p>
        <div className="flex gap-3 text-sm">
          <Link href="/skaiciuokle" className="underline">Atidaryti skaičiuoklę</Link>
          <form action={signOut}><button className="underline">Atsijungti</button></form>
        </div>
      </div>

      <Section title="Bendri nustatymai" hint="Pakeitimai skaičiuoklėje matomi iš karto.">
        <SettingsEditor initial={settingRows} />
      </Section>

      <Section title="Muito tarifai" hint="Palikite tuščią, jei tarifas dar nepatvirtintas — skaičiuoklė naudos 10 % ir parodys įspėjimą.">
        <DutyEditor initial={dutyRows} />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Copart mokesčiai" hint="Mokestis = fiksuota suma + % nuo kainos. Paskutinei eilutei „iki“ palikite tuščią.">
          <FeeEditor auction="copart" initial={feeRows("copart")} />
        </Section>
        <Section title="IAAI mokesčiai" hint="Mokestis = fiksuota suma + % nuo kainos. Paskutinei eilutei „iki“ palikite tuščią.">
          <FeeEditor auction="iaai" initial={feeRows("iaai")} />
        </Section>
      </div>

      <Section title="Užstato planai" hint="Rodomi pradžios puslapyje. Užstatas grąžinamas, jei klientas nelaimi aukciono.">
        <PlansEditor initial={(plans.data ?? []).map((p) => ({
          id: p.id, name: p.name, deposit_eur: String(Number(p.deposit_eur)), max_bid_usd: String(Number(p.max_bid_usd)),
          active_bids: String(p.active_bids), popular: p.popular, active: p.active,
        }))} />
      </Section>

      <Section title="Jūros tarifai iki Klaipėdos" hint="Tuščias laukas — šiai klasei iš to uosto tarifo nėra.">
        <SeaEditor ports={ports.data ?? []} initial={seaMap} />
      </Section>

      <Section title="Paskutiniai pakeitimai">
        {(history.data ?? []).length === 0 ? (
          <p className="muted text-sm">Pakeitimų dar nebuvo.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {history.data!.map((h) => (
              <li key={h.id} className="flex gap-3">
                <span className="muted tabular-nums">
                  {new Date(h.changed_at).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius" })}
                </span>
                <span>{TABLE_LT[h.table_name] ?? h.table_name}</span>
                <span className="muted">{h.op === "UPDATE" ? "pakeista" : h.op === "INSERT" ? "pridėta" : "pašalinta"}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full flex-1 max-w-6xl px-4 py-10 sm:px-6">
      <p className="label">Administravimas</p>
      <h1 className="mt-2 mb-8 text-3xl font-semibold tracking-tight">Tarifai</h1>
      <Suspense fallback={<p className="muted">Kraunama…</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

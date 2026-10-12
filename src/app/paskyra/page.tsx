/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser, supabaseServer } from "@/lib/supabase/server.ts";
import { lotPath, type Lot } from "@/lib/catalog.ts";
import { SITE } from "@/lib/site.ts";
import { fmtDate } from "@/lib/lt.ts";
import { signOut } from "@/app/prisijungti/actions.ts";
import { usd } from "@/components/Breakdown.tsx";
import LotRow from "@/components/LotRow.tsx";
import { cancelBid, requestPlan, requestRefund } from "./actions.ts";
import { ActionButton, PasswordForm, ProfileForm } from "./ui.tsx";

export const metadata: Metadata = { title: "Mano paskyra — Tavo auto USA" };

const TABS = [
  { id: "megstamiausi", label: "Mėgstamiausi", icon: "♡" },
  { id: "statymai", label: "Mano statymai", icon: "◎" },
  { id: "laimeti", label: "Laimėti statymai", icon: "🏆" },
  { id: "pralaimeti", label: "Pralaimėti statymai", icon: "↘" },
  { id: "planai", label: "Planai", icon: "◇" },
  { id: "saskaitos", label: "Sąskaitos", icon: "▤" },
  { id: "profilis", label: "Vartotojo informacija", icon: "👤" },
  { id: "slaptazodis", label: "Slaptažodžio keitimas", icon: "🔒" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const eur = (n: number) => `${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(n)} €`;

function Empty({ text, cta }: { text: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line p-8 text-center">
      <p className="muted">{text}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

const BID_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Laukia aukciono", cls: "badge" },
  placed: { label: "Pateiktas aukcione", cls: "badge badge-copart" },
  won: { label: "Laimėta", cls: "ok inline-block px-2 py-0.5 text-xs font-semibold" },
  lost: { label: "Pralaimėta", cls: "warn inline-block px-2 py-0.5 text-xs font-semibold" },
  cancelled: { label: "Atšaukta", cls: "badge" },
};

type BidRow = {
  id: number; lot_id: string; max_bid_usd: number; status: string; final_price_usd: number | null;
  lot_title: string | null; auction_at: string | null; created_at: string; admin_note: string;
  lots: { thumb: string | null; platform: string; lot_number: string; current_bid_usd: number | null; auction_at: string | null } | null;
};

async function Bids({ statuses, empty }: { statuses: string[]; empty: string }) {
  const db = await supabaseServer();
  const { data } = await db
    .from("bids")
    .select("id,lot_id,max_bid_usd,status,final_price_usd,lot_title,auction_at,created_at,admin_note,lots(thumb,platform,lot_number,current_bid_usd,auction_at)")
    .in("status", statuses)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as BidRow[];
  if (!rows.length) return <Empty text={empty} cta={<Link href="/katalogas" className="btn">Ieškoti automobilio</Link>} />;
  return (
    <ul className="space-y-3">
      {rows.map((b) => {
        const st = BID_STATUS[b.status] ?? BID_STATUS.pending;
        return (
          <li key={b.id} className="grid gap-4 rounded-xl border border-line p-3 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
            <Link href={lotPath(b.lot_id)} className="block aspect-[4/3] overflow-hidden rounded-lg bg-[var(--bg)]">
              {b.lots?.thumb && <img src={b.lots.thumb} alt="" className="h-full w-full object-cover" />}
            </Link>
            <div className="min-w-0">
              <Link href={lotPath(b.lot_id)} className="font-semibold hover:underline">{b.lot_title ?? b.lot_id}</Link>
              <p className="muted mt-1 text-xs">
                {b.lots?.platform === "iaai" ? "IAAI" : "Copart"} · lotas {b.lots?.lot_number} · aukcionas {fmtDate(b.lots?.auction_at ?? b.auction_at)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className={st.cls}>{st.label}</span>
                <span>Jūsų maks. suma: <b className="tabular-nums">{usd(Number(b.max_bid_usd))}</b></span>
                {b.final_price_usd && <span>Galutinė kaina: <b className="tabular-nums">{usd(Number(b.final_price_usd))}</b></span>}
              </div>
              {b.admin_note && <p className="muted mt-2 text-sm">{b.admin_note}</p>}
            </div>
            {b.status === "pending" && (
              <div className="self-center">
                <ActionButton action={cancelBid.bind(null, b.id)} label="Atšaukti" className="btn-outline py-2" confirmText="Atšaukti statymą?" />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function Favorites() {
  const db = await supabaseServer();
  const { data } = await db
    .from("favorites")
    .select("created_at, lots(id,platform,lot_number,vin,title,year,make,model,odometer_mi,primary_damage,secondary_damage,run_condition,has_key,sale_document,auction_at,auction_state,is_buy_now,current_bid_usd,buy_now_usd,sale_price_usd,outcome,facility_city,facility_state,office_name,send_from,thumb,yard_id,vehicle_type,body_style,fuel,engine,transmission,drive,color)")
    .order("created_at", { ascending: false });
  const lots = (data ?? []).map((f) => f.lots as unknown as Lot).filter(Boolean);
  if (!lots.length) return <Empty text="Mėgstamiausių automobilių dar nėra. Paspauskite ♡ automobilio puslapyje." cta={<Link href="/katalogas" className="btn">Į katalogą</Link>} />;
  return <div className="space-y-4">{lots.map((l) => <LotRow key={l.id} lot={l} />)}</div>;
}

type UserPlan = { id: number; name: string; deposit_eur: number; max_bid_usd: number; active_bids: number; status: string; created_at: string; activated_at: string | null; closed_at: string | null };
const PLAN_STATUS: Record<string, string> = {
  pending: "Laukia apmokėjimo", active: "Aktyvus", refund_requested: "Prašoma grąžinti", refunded: "Grąžintas", cancelled: "Atšauktas",
};

async function Plans() {
  const db = await supabaseServer();
  const [{ data: mine }, { data: all }] = await Promise.all([
    db.from("user_plans").select("*").order("created_at", { ascending: false }),
    db.from("deposit_plans").select("id,name,deposit_eur,max_bid_usd,active_bids,popular").eq("active", true).order("sort"),
  ]);
  const plans = (mine ?? []) as UserPlan[];
  const current = plans.find((p) => ["pending", "active", "refund_requested"].includes(p.status));
  return (
    <div className="space-y-8">
      {current && (
        <div className="rounded-xl border-2 p-5" style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
          <p className="label">Jūsų planas</p>
          <p className="mt-1 text-xl font-semibold">{current.name} — {PLAN_STATUS[current.status]}</p>
          <p className="mt-2 text-sm">
            Užstatas {eur(Number(current.deposit_eur))} · maks. statymas {usd(Number(current.max_bid_usd))} · {current.active_bids} aktyvūs statymai
          </p>
          {current.status === "pending" && <p className="mt-2 text-sm">Apmokėjimo instrukcijos — skiltyje <Link href="/paskyra?tab=saskaitos" className="link">Sąskaitos</Link>. Planas įsigalios gavus užstatą.</p>}
          {current.status === "active" && (
            <div className="mt-4">
              <ActionButton action={requestRefund.bind(null, current.id)} label="Prašyti grąžinti užstatą" className="btn-outline py-2"
                confirmText="Grąžinus užstatą statyti nebegalėsite. Tęsti?" />
            </div>
          )}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold">{current ? "Kiti planai" : "Išsirinkite tinkamiausią planą"}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(all ?? []).map((p) => (
            <div key={p.id} className={`rounded-xl border p-5 ${p.popular ? "border-accent" : "border-line"}`}>
              <p className="text-lg">{p.name}</p>
              <p className="link mt-1 font-semibold">Užstatas: {eur(Number(p.deposit_eur))}</p>
              <ul className="muted mt-3 space-y-1 text-sm">
                <li>Maksimalus statymas: iki {usd(Number(p.max_bid_usd))}</li>
                <li>Leidžiama: {p.active_bids} aktyvūs statymai</li>
              </ul>
              <div className="mt-4">
                {current ? (
                  <button disabled className="btn w-full opacity-50">Pasirinkti planą</button>
                ) : (
                  <ActionButton action={requestPlan.bind(null, p.id)} label="Pasirinkti planą" className="btn w-full"
                    confirmText={`Užsakyti „${p.name}“ (${eur(Number(p.deposit_eur))})?`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function Invoices() {
  const db = await supabaseServer();
  const { data } = await db.from("user_plans").select("*").order("created_at", { ascending: false });
  const plans = (data ?? []) as UserPlan[];
  const pending = plans.filter((p) => p.status === "pending");
  const history = plans.filter((p) => p.status !== "pending");
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Laukiami apmokėjimai</h3>
        {pending.length === 0 ? <p className="muted mt-2 text-sm">Sąrašas tuščias.</p> : pending.map((p) => (
          <div key={p.id} className="mt-3 rounded-xl border border-line p-4 text-sm">
            <p className="font-semibold">Užstatas — planas „{p.name}“: {eur(Number(p.deposit_eur))}</p>
            {SITE.bankIban ? (
              <dl className="mt-3 grid gap-1 sm:grid-cols-[160px_1fr]">
                <dt className="muted">Gavėjas</dt><dd>{SITE.bankRecipient}</dd>
                <dt className="muted">Sąskaitos nr.</dt><dd className="font-mono">{SITE.bankIban}</dd>
                <dt className="muted">Suma</dt><dd>{eur(Number(p.deposit_eur))}</dd>
                <dt className="muted">Mokėjimo paskirtis</dt><dd className="font-mono">Užstatas U{p.id}</dd>
              </dl>
            ) : (
              <p className="muted mt-2">Apmokėjimo rekvizitus atsiųsime el. paštu artimiausiu metu.</p>
            )}
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-semibold">Mokėjimų istorija</h3>
        {history.length === 0 ? <p className="muted mt-2 text-sm">Sąrašas tuščias.</p> : (
          <table className="mt-3 w-full text-sm">
            <thead><tr className="muted text-left text-xs"><th className="pb-2">Data</th><th className="pb-2">Planas</th><th className="pb-2 text-right">Suma</th><th className="pb-2 text-right">Būsena</th></tr></thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2">{fmtDate(p.activated_at ?? p.created_at)}</td>
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right tabular-nums">{eur(Number(p.deposit_eur))}</td>
                  <td className="py-2 text-right">{PLAN_STATUS[p.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

async function Profile({ userId, email }: { userId: string; email: string }) {
  const db = await supabaseServer();
  const { data } = await db.from("profiles")
    .select("first_name,last_name,phone,country,address,city,zip,company_name,company_code,vat_code,company_address")
    .eq("id", userId).maybeSingle();
  return <ProfileForm profile={(data ?? {}) as Record<string, string>} email={email} />;
}

const TITLES: Record<TabId, [string, string]> = {
  megstamiausi: ["Mėgstamiausi", "Automobiliai, kuriuos pažymėjote ♡"],
  statymai: ["Mano statymai", "Peržiūrėkite ir stebėkite savo aktyvius statymus vienoje vietoje"],
  laimeti: ["Laimėti statymai", "Automobiliai, kuriuos laimėjote aukcione"],
  pralaimeti: ["Pralaimėti statymai", "Aukcionai, kuriuose jūsų suma nelaimėjo"],
  planai: ["Planai", "Užstato planas nustato, už kiek ir kiek automobilių vienu metu galite statyti"],
  saskaitos: ["Sąskaitos", "Užstato mokėjimai ir jų istorija"],
  profilis: ["Vartotojo informacija", "Atnaujinkite savo asmeninę informaciją"],
  slaptazodis: ["Slaptažodžio keitimas", "Naujas slaptažodis — bent 8 simboliai"],
};

async function AccountView({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await currentUser();
  if (!user) redirect("/prisijungti?next=/paskyra");
  const sp = await searchParams;
  const raw = typeof sp.tab === "string" ? sp.tab : "statymai";
  const tab: TabId = (TABS.some((t) => t.id === raw) ? raw : "statymai") as TabId;
  const [title, sub] = TITLES[tab];

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl font-semibold text-white" style={{ background: "var(--accent)" }}>
            {(user.firstName || user.email).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name || "Klientas"}</p>
            <p className="muted truncate text-sm">{user.email}</p>
          </div>
        </div>
        <nav className="flex overflow-x-auto lg:block" aria-label="Paskyros meniu">
          {TABS.map((t) => (
            <Link key={t.id} href={`/paskyra?tab=${t.id}`}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap px-5 py-3 text-[15px] lg:border-r-2 ${tab === t.id ? "border-accent text-accent" : "border-transparent hover:bg-[var(--bg)]"}`}
              style={tab === t.id ? { background: "var(--accent-soft)" } : undefined}
              aria-current={tab === t.id ? "page" : undefined}>
              <span aria-hidden="true" className="w-5 text-center">{t.icon}</span> {t.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="flex w-full shrink-0 items-center gap-3 whitespace-nowrap px-5 py-3 text-left text-[15px] hover:bg-[var(--bg)]">
              <span aria-hidden="true" className="w-5 text-center">⎋</span> Atsijungti
            </button>
          </form>
        </nav>
      </aside>

      <section className="min-w-0 rounded-xl border border-line bg-white p-5 sm:p-7">
        <h1 className="text-2xl font-normal">{title}</h1>
        <p className="muted mt-1 text-sm">{sub}</p>
        <div className="mt-6">
          <Suspense fallback={<p className="muted">Kraunama…</p>}>
            {tab === "megstamiausi" && <Favorites />}
            {tab === "statymai" && <Bids statuses={["pending", "placed"]} empty="Aktyvių statymų nėra." />}
            {tab === "laimeti" && <Bids statuses={["won"]} empty="Laimėtų aukcionų dar nėra." />}
            {tab === "pralaimeti" && <Bids statuses={["lost", "cancelled"]} empty="Sąrašas tuščias." />}
            {tab === "planai" && <Plans />}
            {tab === "saskaitos" && <Invoices />}
            {tab === "profilis" && <Profile userId={user.id} email={user.email} />}
            {tab === "slaptazodis" && <PasswordForm />}
          </Suspense>
        </div>
      </section>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/paskyra">) {
  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-8">
        <Suspense fallback={<p className="muted">Kraunama…</p>}>
          <AccountView searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

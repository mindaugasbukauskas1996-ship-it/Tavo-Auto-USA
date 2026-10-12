/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase/server.ts";
import { lotPath } from "@/lib/catalog.ts";
import { fmtDate, timeLeft } from "@/lib/lt.ts";
import { usd } from "@/components/Breakdown.tsx";
import { NotAdmin, requireAdmin } from "../guard.tsx";
import { BidEditor } from "../ui.tsx";

export const metadata: Metadata = { title: "Statymai — administravimas" };

const FILTERS = [
  { id: "aktyvus", label: "Aktyvūs", statuses: ["pending", "placed"] },
  { id: "laimeti", label: "Laimėti", statuses: ["won"] },
  { id: "pralaimeti", label: "Pralaimėti", statuses: ["lost"] },
  { id: "atsaukti", label: "Atšaukti", statuses: ["cancelled"] },
];

type Row = {
  id: number; user_id: string; lot_id: string; max_bid_usd: number; status: string; final_price_usd: number | null;
  admin_note: string; lot_title: string | null; created_at: string;
  lots: { thumb: string | null; platform: string; lot_number: string; auction_at: string | null; current_bid_usd: number | null; office_name: string | null } | null;
};

async function List({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdmin("/admin/statymai");
  if (!user.isAdmin) return <NotAdmin email={user.email} />;
  const sp = await searchParams;
  const f = FILTERS.find((x) => x.id === sp.f) ?? FILTERS[0];
  const db = await supabaseServer();
  const { data } = await db.from("bids")
    .select("id,user_id,lot_id,max_bid_usd,status,final_price_usd,admin_note,lot_title,created_at,lots(thumb,platform,lot_number,auction_at,current_bid_usd,office_name)")
    .in("status", f.statuses).order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = ids.length
    ? await db.from("profiles").select("id,first_name,last_name,phone,email").in("id", ids)
    : { data: [] };
  const who = new Map((profs ?? []).map((p) => [p.id, p]));
  // Artimiausi aukcionai viršuje
  if (f.id === "aktyvus") rows.sort((a, b) => (a.lots?.auction_at ?? "9").localeCompare(b.lots?.auction_at ?? "9"));

  return (
    <>
      <nav className="mb-5 flex gap-1 border-b border-line">
        {FILTERS.map((x) => (
          <Link key={x.id} href={`/admin/statymai?f=${x.id}`} className={`tab ${x.id === f.id ? "tab-on" : ""}`}>{x.label}</Link>
        ))}
      </nav>
      {rows.length === 0 && <p className="muted">Statymų nėra.</p>}
      <ul className="space-y-3">
        {rows.map((b) => {
          const p = who.get(b.user_id);
          const left = timeLeft(b.lots?.auction_at);
          return (
            <li key={b.id} className="rounded-xl border border-line bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
                <Link href={lotPath(b.lot_id)} className="block aspect-[4/3] overflow-hidden rounded-md bg-[var(--bg)]">
                  {b.lots?.thumb && <img src={b.lots.thumb} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-0 text-sm">
                  <Link href={lotPath(b.lot_id)} className="font-semibold hover:underline">{b.lot_title}</Link>
                  <p className="muted mt-0.5">
                    {b.lots?.platform === "iaai" ? "IAAI" : "Copart"} lotas <b className="font-mono text-ink">{b.lots?.lot_number}</b> · {b.lots?.office_name}
                  </p>
                  <p className="mt-1">Aukcionas: <b>{fmtDate(b.lots?.auction_at)}</b>{left && <span className="link"> (liko {left})</span>}</p>
                  <p className="mt-1">Klientas: {p ? `${p.first_name} ${p.last_name}`.trim() || p.email : "—"}{p?.phone && <> · <a href={`tel:${p.phone}`} className="link">{p.phone}</a></>}{p?.email && <> · <a href={`mailto:${p.email}`} className="link">{p.email}</a></>}</p>
                </div>
                <div className="text-right">
                  <p className="muted text-xs">Maks. suma</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>{usd(Number(b.max_bid_usd))}</p>
                  <p className="muted mt-1 text-xs">Dabar: {(b.lots?.current_bid_usd ?? 0) > 1 ? usd(Number(b.lots!.current_bid_usd)) : "—"}</p>
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <BidEditor id={b.id} status={b.status} finalPrice={b.final_price_usd === null ? null : Number(b.final_price_usd)} note={b.admin_note} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/admin/statymai">) {
  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-8">
        <p className="muted text-sm"><Link href="/admin" className="hover:text-accent">Administravimas</Link> / Statymai</p>
        <h1 className="mb-6 mt-1 text-3xl font-normal">Statymai</h1>
        <Suspense fallback={<p className="muted">Kraunama…</p>}>
          <List searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

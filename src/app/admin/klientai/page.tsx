import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase/server.ts";
import { fmtDate } from "@/lib/lt.ts";
import { usd } from "@/components/Breakdown.tsx";
import { NotAdmin, requireAdmin } from "../guard.tsx";
import { PlanActions, TelegramForm } from "../ui.tsx";

export const metadata: Metadata = { title: "Klientai — administravimas" };

const STATUS: Record<string, string> = {
  pending: "Laukia apmokėjimo", active: "Aktyvus", refund_requested: "Prašo grąžinti", refunded: "Grąžintas", cancelled: "Atšauktas",
};
const eur = (n: number) => `${new Intl.NumberFormat("lt-LT").format(n)} €`;

async function Content() {
  const user = await requireAdmin("/admin/klientai");
  if (!user.isAdmin) return <NotAdmin email={user.email} />;
  const db = await supabaseServer();
  const [{ data: plans }, { data: profiles }, { data: tg }] = await Promise.all([
    db.from("user_plans").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("profiles").select("id,first_name,last_name,phone,email,role,created_at").order("created_at", { ascending: false }).limit(500),
    db.rpc("telegram_status"),
  ]);
  const who = new Map((profiles ?? []).map((p) => [p.id, p]));
  const open = (plans ?? []).filter((p) => ["pending", "refund_requested"].includes(p.status));
  const tgStatus = (tg ?? {}) as { has_token?: boolean; chat_id?: string };

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold">Laukia veiksmo ({open.length})</h2>
        <p className="muted text-sm">Gavę užstato pavedimą spauskite „Aktyvuoti“ — klientas iškart galės statyti.</p>
        <PlanTable rows={open} who={who} />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Visi planai</h2>
        <PlanTable rows={(plans ?? []).filter((p) => !["pending", "refund_requested"].includes(p.status))} who={who} />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Klientai ({profiles?.length ?? 0})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="muted text-left text-xs"><th className="pb-2">Vardas</th><th className="pb-2">El. paštas</th><th className="pb-2">Telefonas</th><th className="pb-2">Registruotas</th></tr></thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-2">{`${p.first_name} ${p.last_name}`.trim() || "—"}{p.role === "admin" && <span className="badge badge-copart ml-2">admin</span>}</td>
                  <td className="py-2"><a href={`mailto:${p.email}`} className="link">{p.email}</a></td>
                  <td className="py-2">{p.phone || "—"}</td>
                  <td className="py-2">{fmtDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" id="telegram">
        <h2 className="text-lg font-semibold">Pranešimai Telegram</h2>
        <ol className="muted mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>Telegram programėlėje parašykite <b>@BotFather</b> → <b>/newbot</b>, sugalvokite pavadinimą. Gausite boto raktą.</li>
          <li>Atidarykite savo naują botą ir paspauskite <b>Start</b> (kitaip jis negalės jums rašyti).</li>
          <li>Parašykite <b>@userinfobot</b> — jis atsakys jūsų ID (skaičius).</li>
          <li>Įveskite abu laukus žemiau ir išsiųskite bandomąjį pranešimą.</li>
        </ol>
        <div className="mt-4"><TelegramForm hasToken={!!tgStatus.has_token} chatId={tgStatus.chat_id ?? ""} /></div>
      </section>
    </div>
  );
}

type PlanRow = { id: number; user_id: string; name: string; deposit_eur: number; max_bid_usd: number; active_bids: number; status: string; created_at: string };

function PlanTable({ rows, who }: { rows: PlanRow[]; who: Map<string, { first_name: string; last_name: string; email: string; phone: string }> }) {
  if (!rows.length) return <p className="muted mt-3 text-sm">Sąrašas tuščias.</p>;
  return (
    <ul className="mt-3 divide-y divide-line">
      {rows.map((p) => {
        const c = who.get(p.user_id);
        return (
          <li key={p.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p><b>{p.name}</b> · {eur(Number(p.deposit_eur))} · iki {usd(Number(p.max_bid_usd))} · {p.active_bids} statymai — <span className="link">{STATUS[p.status]}</span></p>
              <p className="muted">
                {c ? `${c.first_name} ${c.last_name}`.trim() || c.email : "—"}{c?.phone && ` · ${c.phone}`}{c?.email && ` · ${c.email}`} · užsakyta {fmtDate(p.created_at)} · mokėjimo paskirtis <span className="font-mono">Užstatas U{p.id}</span>
              </p>
            </div>
            <PlanActions id={p.id} status={p.status} />
          </li>
        );
      })}
    </ul>
  );
}

export default function Page() {
  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-8">
        <p className="muted text-sm"><Link href="/admin" className="hover:text-accent">Administravimas</Link> / Klientai ir planai</p>
        <h1 className="mb-6 mt-1 text-3xl font-normal">Klientai ir planai</h1>
        <Suspense fallback={<p className="muted">Kraunama…</p>}>
          <Content />
        </Suspense>
      </div>
    </main>
  );
}

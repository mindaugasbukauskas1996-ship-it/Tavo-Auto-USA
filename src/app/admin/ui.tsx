"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTelegram, setPlanStatus, testTelegram, updateBid, type AdminResult } from "./actions.ts";

function Msg({ r }: { r: AdminResult | null }) {
  return r ? <span className={`${r.ok ? "ok" : "warn"} px-2 py-1 text-xs`}>{r.message}</span> : null;
}

const STATUS_LABELS: [string, string][] = [
  ["pending", "Laukia"], ["placed", "Pateikta aukcione"], ["won", "Laimėta"], ["lost", "Pralaimėta"], ["cancelled", "Atšaukta"],
];

export function BidEditor({ id, status, finalPrice, note }: { id: number; status: string; finalPrice: number | null; note: string }) {
  const [s, setS] = useState(status);
  const [fp, setFp] = useState(finalPrice?.toString() ?? "");
  const [n, setN] = useState(note);
  const [r, setR] = useState<AdminResult | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="grid gap-2 sm:grid-cols-[170px_120px_minmax(0,1fr)_auto] sm:items-center">
      <select aria-label="Būsena" value={s} onChange={(e) => { setS(e.target.value); setR(null); }} className="field py-1.5">
        {STATUS_LABELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input aria-label="Galutinė kaina, $" placeholder="Galutinė $" inputMode="decimal" value={fp} onChange={(e) => { setFp(e.target.value); setR(null); }} className="field py-1.5" />
      <input aria-label="Pastaba klientui" placeholder="Pastaba klientui" value={n} onChange={(e) => { setN(e.target.value); setR(null); }} className="field py-1.5" />
      <div className="flex items-center gap-2">
        <button type="button" disabled={pending} className="btn py-1.5 disabled:opacity-60"
          onClick={() => start(async () => { const res = await updateBid(id, s, fp, n); setR(res); if (res.ok) router.refresh(); })}>
          {pending ? "…" : "Išsaugoti"}
        </button>
        <Msg r={r} />
      </div>
    </div>
  );
}

export function PlanActions({ id, status }: { id: number; status: string }) {
  const [r, setR] = useState<AdminResult | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const act = (a: string) => start(async () => { const res = await setPlanStatus(id, a); setR(res); if (res.ok) router.refresh(); });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "pending" && <button type="button" disabled={pending} className="btn py-1.5" onClick={() => act("activate")}>Gautas — aktyvuoti</button>}
      {status === "refund_requested" && <button type="button" disabled={pending} className="btn py-1.5" onClick={() => act("refunded")}>Grąžinta</button>}
      {["pending", "active", "refund_requested"].includes(status) && (
        <button type="button" disabled={pending} className="btn-outline py-1.5" onClick={() => act("cancel")}>Atšaukti</button>
      )}
      <Msg r={r} />
    </div>
  );
}

export function TelegramForm({ hasToken, chatId }: { hasToken: boolean; chatId: string }) {
  const [r, action, pending] = useActionState(saveTelegram, null);
  const [t, setT] = useState<AdminResult | null>(null);
  const [testing, start] = useTransition();
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tg-token" className="label">Boto raktas {hasToken && <span className="ok ml-1 px-1.5 py-0.5 text-xs">išsaugotas</span>}</label>
          <input id="tg-token" name="token" type="password" autoComplete="off" placeholder={hasToken ? "•••••• (palikite tuščią, jei nekeičiate)" : "123456789:AA..."} className="field mt-1.5" />
        </div>
        <div>
          <label htmlFor="tg-chat" className="label">Jūsų Telegram ID</label>
          <input id="tg-chat" name="chat" inputMode="numeric" defaultValue={chatId} placeholder="pvz. 123456789" className="field mt-1.5" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn disabled:opacity-60">{pending ? "Saugoma…" : "Išsaugoti"}</button>
        <button type="button" disabled={testing || !hasToken || !chatId} className="btn-outline disabled:opacity-50"
          onClick={() => start(async () => setT(await testTelegram()))}>Siųsti bandomąjį pranešimą</button>
        <Msg r={r} /><Msg r={t} />
      </div>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { placeBid, type ActionResult } from "@/app/paskyra/actions.ts";

const fmt = (n: number) => `$${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(n)}`;

/** Statymo valdiklis: − suma + ir „Statyti“. Patikros (planas, limitai) vyksta DB funkcijoje place_bid. */
export default function BidBox({ lotId, start, step = 100, loggedIn, lotPath, myBid }: {
  lotId: string; start: number; step?: number; loggedIn: boolean; lotPath: string; myBid: number | null;
}) {
  const [v, setV] = useState(myBid ? myBid + step : start);
  const [pending, run] = useTransition();
  const [r, setR] = useState<ActionResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (!loggedIn) {
    return <Link href={`/prisijungti?next=${encodeURIComponent(lotPath)}`} className="btn w-full">Prisijunkite, kad galėtumėte statyti</Link>;
  }

  const submit = () => run(async () => {
    setConfirming(false);
    const res = await placeBid(lotId, v);
    setR(res);
    if (res.ok) router.refresh();
  });

  return (
    <div className="space-y-3">
      <div className="flex items-stretch overflow-hidden rounded-md border border-line">
        <button type="button" className="px-4 text-lg hover:bg-[var(--bg)]" aria-label="Mažinti" onClick={() => setV(Math.max(0, v - step))}>−</button>
        <input aria-label="Jūsų maksimali suma" inputMode="numeric" value={fmt(v)}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (Number.isFinite(n)) setV(n); }}
          className="w-full border-x border-line py-2.5 text-center font-semibold tabular-nums outline-none" />
        <button type="button" className="px-4 text-lg hover:bg-[var(--bg)]" aria-label="Didinti" onClick={() => setV(v + step)}>+</button>
      </div>

      {confirming ? (
        <div className="rounded-lg border border-accent p-3 text-sm">
          <p>Patvirtinate maksimalų statymą <b>{fmt(v)}</b>? Laimėjus statymas yra įpareigojantis — automobilį reikės apmokėti.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn flex-1" onClick={submit}>Patvirtinti</button>
            <button type="button" className="btn-outline flex-1" onClick={() => setConfirming(false)}>Atšaukti</button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={pending || v <= 0} className="btn w-full disabled:opacity-60" onClick={() => setConfirming(true)}>
          {pending ? "Siunčiama…" : myBid ? "Pakeisti statymą" : "Statyti"}
        </button>
      )}

      {r && (
        <p className={`${r.ok ? "ok" : "warn"} text-sm`} role="status">
          {r.message}
          {!r.ok && /plan/i.test(r.message) && <> <Link href="/paskyra?tab=planai" className="link">Pasirinkti planą →</Link></>}
        </p>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";

const fmt = (n: number) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Statymo valdiklis: − suma +. Statymų priėmimas bus įjungtas kitame modulyje. */
export default function BidBox({ start, step = 100, loggedIn, lotPath }: { start: number; step?: number; loggedIn: boolean; lotPath: string }) {
  const [v, setV] = useState(start);
  return (
    <div className="space-y-3">
      <div className="flex items-stretch overflow-hidden rounded-md border border-line">
        <button type="button" className="px-4 text-lg hover:bg-[var(--bg)]" aria-label="Mažinti" onClick={() => setV(Math.max(0, v - step))}>−</button>
        <input aria-label="Jūsų maksimali suma" inputMode="numeric" value={fmt(v)}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (Number.isFinite(n)) setV(n); }}
          className="w-full border-x border-line py-2.5 text-center font-semibold tabular-nums outline-none" />
        <button type="button" className="px-4 text-lg hover:bg-[var(--bg)]" aria-label="Didinti" onClick={() => setV(v + step)}>+</button>
      </div>
      {loggedIn ? (
        <>
          <button type="button" disabled className="btn w-full opacity-60">Statyti</button>
          <p className="muted text-center text-xs">Statymų priėmimas įjungiamas netrukus.</p>
        </>
      ) : (
        <Link href={`/prisijungti?next=${encodeURIComponent(lotPath)}`} className="btn w-full">Prisijunkite, kad galėtumėte statyti</Link>
      )}
    </div>
  );
}

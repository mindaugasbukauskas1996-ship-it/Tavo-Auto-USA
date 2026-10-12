/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Lot } from "@/lib/catalog.ts";
import { lotPath } from "@/lib/catalog.ts";
import { usd } from "@/components/Breakdown.tsx";
import { fmtKm, ltFuel, ltRunCondition, ltTransmission, timeLeft } from "@/lib/lt.ts";
import { IconCar, IconFuel, IconGauge, IconGear, IconPin } from "./icons.tsx";

export function AuctionBadge({ platform }: { platform: Lot["platform"] }) {
  return <span className={`badge ${platform === "copart" ? "badge-copart" : "badge-iaai"}`}>{platform === "copart" ? "Copart" : "IAAI"}</span>;
}

export function PriceBox({ lot }: { lot: Lot }) {
  const sold = lot.sale_price_usd && (lot.outcome === "sold" || lot.auction_state === "ended");
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg px-3 py-2.5 text-center" style={{ background: "var(--accent-soft)" }}>
      <div>
        <p className="muted text-xs">{sold ? "Parduota už" : "Paskutinis statymas"}</p>
        <p className="font-bold tabular-nums">{sold ? usd(lot.sale_price_usd!) : lot.current_bid_usd ? usd(lot.current_bid_usd) : "—"}</p>
      </div>
      <div>
        <p className="muted text-xs">Pirkti dabar kaina</p>
        <p className="font-bold tabular-nums" style={{ color: lot.buy_now_usd ? "var(--accent)" : undefined }}>
          {lot.buy_now_usd ? usd(lot.buy_now_usd) : "—"}
        </p>
      </div>
    </div>
  );
}

export function Spec({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px]">
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

export const lotLocation = (lot: Lot) =>
  lot.office_name ?? ([lot.facility_state, lot.facility_city].filter(Boolean).join(" - ") || "—");

/** Vertikali kortelė (pradžios puslapis, „Naujausi aukcionai“). */
export default function LotCard({ lot }: { lot: Lot }) {
  const left = timeLeft(lot.auction_at);
  const href = lotPath(lot.id);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-lg">
      <Link href={href} className="relative block aspect-[4/3] bg-[var(--bg)]">
        {lot.thumb && <img src={lot.thumb} alt={lot.title ?? ""} loading="lazy" className="h-full w-full object-cover" />}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {left && <span className="badge" style={{ background: "var(--accent)", color: "#fff" }}>Liko: {left}</span>}
          <AuctionBadge platform={lot.platform} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="truncate text-[17px] font-semibold hover:underline" style={{ color: "var(--accent)" }} title={lot.title ?? ""}>
          {lot.title}
        </Link>
        <p className="muted mt-1 flex items-center gap-1 text-xs"><IconPin size={14} /> {lotLocation(lot)}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3">
          <Spec icon={<IconGauge size={16} />}>{fmtKm(lot.odometer_mi)}</Spec>
          <Spec icon={<IconGear size={16} />}>{ltTransmission(lot.transmission) ?? "—"}</Spec>
          <Spec icon={<IconFuel size={16} />}>{ltFuel(lot.fuel) ?? "—"}</Spec>
          <Spec icon={<IconCar size={16} />}>{ltRunCondition(lot.run_condition) ?? "—"}</Spec>
        </div>
        <div className="mt-auto pt-4">
          <PriceBox lot={lot} />
          <Link href={href} className="btn mt-3 w-full">Atlikti statymą</Link>
        </div>
      </div>
    </article>
  );
}

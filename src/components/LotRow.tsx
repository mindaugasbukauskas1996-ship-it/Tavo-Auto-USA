/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Lot } from "@/lib/catalog.ts";
import { lotPath } from "@/lib/catalog.ts";
import { fmtKm, ltDamage, ltDrive, ltFuel, ltRunCondition, ltTransmission, timeLeft } from "@/lib/lt.ts";
import { AuctionBadge, PriceBox, Spec, lotLocation } from "./LotCard.tsx";
import { IconFuel, IconGauge, IconGear, IconPin } from "./icons.tsx";

function Field({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="muted text-xs">{k}</p>
      <p className="truncate text-[13px] font-medium">{v || "—"}</p>
    </div>
  );
}

/** Horizontali kortelė katalogo sąraše. */
export default function LotRow({ lot }: { lot: Lot }) {
  const href = lotPath(lot.id);
  const left = timeLeft(lot.auction_at);
  const ended = lot.auction_state === "ended" || !!lot.outcome;
  return (
    <article className="grid gap-4 rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-md sm:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_220px]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[var(--bg)]">
        {lot.thumb && <img src={lot.thumb} alt={lot.title ?? ""} loading="lazy" className="h-full w-full object-cover" />}
        <span className="badge badge-dark absolute left-2 top-2">
          {ended ? "Aukcionas baigėsi" : left ? `Liko: ${left}` : "Vyksta aukcionas"}
        </span>
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} className="text-lg font-semibold hover:underline">{lot.title}</Link>
          <AuctionBadge platform={lot.platform} />
        </div>
        <div className="muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1"><IconPin size={14} /> {lotLocation(lot)}</span>
          <Spec icon={<IconGauge size={14} />}>{fmtKm(lot.odometer_mi)}</Spec>
          <Spec icon={<IconGear size={14} />}>{ltTransmission(lot.transmission) ?? "—"}</Spec>
          <Spec icon={<IconFuel size={14} />}>{ltFuel(lot.fuel) ?? "—"}</Spec>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3 sm:grid-cols-3">
          <Field k="Pagrindinis pažeidimas" v={ltDamage(lot.primary_damage)} />
          <Field k="Variklio būsena" v={ltRunCondition(lot.run_condition)} />
          <Field k="Dokumentas" v={lot.sale_document} />
          <Field k="Variklis" v={lot.engine} />
          <Field k="Varantieji ratai" v={ltDrive(lot.drive)} />
          <Field k="Lotas" v={lot.lot_number} />
        </div>
      </div>

      <div className="flex flex-col justify-end gap-3 sm:col-span-2 lg:col-span-1">
        <PriceBox lot={lot} />
        <Link href={href} className="btn w-full">{ended ? "Peržiūrėti" : "Atlikti statymą"}</Link>
      </div>
    </article>
  );
}

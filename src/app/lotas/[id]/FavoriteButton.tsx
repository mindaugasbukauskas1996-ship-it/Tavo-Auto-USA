"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/paskyra/actions.ts";

export default function FavoriteButton({ lotId, initial, loggedIn, lotPath }: { lotId: string; initial: boolean; loggedIn: boolean; lotPath: string }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const label = on ? "Pašalinti iš mėgstamiausių" : "Pridėti prie mėgstamiausių";
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={on} disabled={pending}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-xl transition-colors hover:border-accent"
      style={{ color: on ? "#e11d48" : "var(--muted)" }}
      onClick={() => {
        if (!loggedIn) { router.push(`/prisijungti?next=${encodeURIComponent(lotPath)}`); return; }
        const next = !on; setOn(next);
        start(async () => { const r = await toggleFavorite(lotId, next); if (!r.ok) setOn(!next); });
      }}>
      {on ? "♥" : "♡"}
    </button>
  );
}

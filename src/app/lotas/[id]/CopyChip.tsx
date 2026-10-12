"use client";
import { useState } from "react";

export default function CopyChip({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="muted">{label}</span>
      <button type="button" className="chip" title="Kopijuoti"
        onClick={async () => {
          try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* naršyklė neleidžia */ }
        }}>
        {value} <span aria-hidden="true">{done ? "✓" : "⧉"}</span>
        <span className="sr-only">{done ? "Nukopijuota" : "Kopijuoti"}</span>
      </button>
    </span>
  );
}

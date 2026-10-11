"use client";

import { useState, useTransition } from "react";
import { saveDuty, saveFees, saveSea, saveSettings, type FeeRow, type SaveResult } from "./actions.ts";

function useSaver() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);
  const run = (fn: () => Promise<SaveResult>) => start(async () => setResult(await fn()));
  return { pending, result, run, clear: () => setResult(null) };
}

function SaveBar({ pending, result, onSave }: { pending: boolean; result: SaveResult | null; onSave: () => void }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <button type="button" onClick={onSave} disabled={pending} className="btn disabled:opacity-60">
        {pending ? "Saugoma…" : "Išsaugoti"}
      </button>
      {result && (
        <p className={`text-sm ${result.ok ? "ok" : "warn"}`} role="status">{result.message}</p>
      )}
    </div>
  );
}

/* ---------- Nustatymai ---------- */

export type SettingRow = { key: string; label: string; unit: string; value: number };

export function SettingsEditor({ initial }: { initial: SettingRow[] }) {
  const show = (r: SettingRow) => String(r.unit === "%" ? +(r.value * 100).toFixed(4) : r.value);
  const [vals, setVals] = useState(() => Object.fromEntries(initial.map((r) => [r.key, show(r)])));
  const s = useSaver();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initial.map((r) => (
          <div key={r.key}>
            <label htmlFor={`s-${r.key}`} className="label">{r.label}</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id={`s-${r.key}`} inputMode="decimal" className="field tabular-nums"
                value={vals[r.key]} onChange={(e) => { s.clear(); setVals({ ...vals, [r.key]: e.target.value }); }}
              />
              <span className="muted w-10 text-sm">{r.unit === "EUR" && r.key === "usd_to_eur" ? "€/$" : r.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <SaveBar {...s} onSave={() => s.run(() => saveSettings(initial.map((r) => ({ key: r.key, unit: r.unit, value: vals[r.key] }))))} />
    </>
  );
}

/* ---------- Muitas ---------- */

export type DutyRow = { type: string; label: string; pct: number | null };

export function DutyEditor({ initial }: { initial: DutyRow[] }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(initial.map((r) => [r.type, r.pct === null ? "" : String(+(r.pct * 100).toFixed(4))])));
  const s = useSaver();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {initial.map((r) => (
          <div key={r.type}>
            <label htmlFor={`d-${r.type}`} className="label">{r.label}</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id={`d-${r.type}`} inputMode="decimal" placeholder="nepatvirtinta" className="field tabular-nums"
                value={vals[r.type]} onChange={(e) => { s.clear(); setVals({ ...vals, [r.type]: e.target.value }); }}
              />
              <span className="muted text-sm">%</span>
            </div>
          </div>
        ))}
      </div>
      <SaveBar {...s} onSave={() => s.run(() => saveDuty(initial.map((r) => ({ type: r.type, pct: vals[r.type] }))))} />
    </>
  );
}

/* ---------- Aukciono mokesčiai ---------- */

const emptyRow = (): FeeRow => ({ fromUsd: "", toUsd: "", feeUsd: "", pct: "" });

/** Iš Excel nukopijuotos eilutės: nuo, iki, mokestis $, % (stulpeliai atskirti tabuliacija arba „;“). */
function parsePasted(text: string): FeeRow[] {
  const clean = (v = "") => v.replace(/[$€%\s]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  return text
    .split(/\r?\n/)
    .map((l) => l.split(/\t|;/))
    .filter((c) => c.length >= 2 && /\d/.test(c[0]))
    .map((c) => ({ fromUsd: clean(c[0]), toUsd: clean(c[1]), feeUsd: clean(c[2]), pct: clean(c[3]) }));
}

export function FeeEditor({ auction, initial }: { auction: "copart" | "iaai"; initial: FeeRow[] }) {
  const [rows, setRows] = useState<FeeRow[]>(initial.length ? initial : [emptyRow()]);
  const [paste, setPaste] = useState("");
  const s = useSaver();
  const set = (i: number, k: keyof FeeRow, v: string) => {
    s.clear();
    setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  };
  const cols: [keyof FeeRow, string][] = [["fromUsd", "Nuo, $"], ["toUsd", "Iki, $"], ["feeUsd", "Mokestis, $"], ["pct", "+ % nuo kainos"]];

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="muted text-left text-xs uppercase tracking-wide">
              {cols.map(([, l]) => <th key={l} className="pb-2 pr-2 font-medium">{l}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map(([k, l]) => (
                  <td key={k} className="py-1 pr-2">
                    <input
                      aria-label={`${l}, eilutė ${i + 1}`} inputMode="decimal" className="field py-1.5 tabular-nums"
                      placeholder={k === "toUsd" ? "be ribos" : ""} value={r[k]} onChange={(e) => set(i, k, e.target.value)}
                    />
                  </td>
                ))}
                <td className="py-1">
                  <button type="button" className="muted px-2 text-lg" aria-label={`Šalinti eilutę ${i + 1}`}
                    onClick={() => { s.clear(); setRows(rows.filter((_, j) => j !== i)); }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="seg mt-2 text-sm" onClick={() => setRows([...rows, emptyRow()])}>+ Eilutė</button>

      <details className="mt-4">
        <summary className="muted cursor-pointer text-sm">Įklijuoti iš Excel</summary>
        <p className="muted mt-2 text-xs">Stulpeliai: nuo, iki, mokestis $, % (nebūtinas). Įklijavus esamos eilutės pakeičiamos.</p>
        <textarea className="field mt-2 h-28 font-mono text-xs" value={paste} onChange={(e) => setPaste(e.target.value)} />
        <button type="button" className="seg mt-2 text-sm" onClick={() => {
          const p = parsePasted(paste);
          if (p.length) { setRows(p); setPaste(""); s.clear(); }
        }}>Perkelti į lentelę</button>
      </details>

      <SaveBar {...s} onSave={() => s.run(() => saveFees(auction, rows))} />
    </>
  );
}

/* ---------- Jūra ---------- */

const SIZE_LABELS: [string, string][] = [
  ["regular", "Regular"], ["large", "Large"], ["oversize", "Oversize"], ["moto", "Moto"], ["moto_large", "Didelis moto"],
];

export function SeaEditor({ ports, initial }: { ports: { code: string; name: string }[]; initial: Record<string, Record<string, number>> }) {
  const key = (p: string, s: string) => `${p}|${s}`;
  const [vals, setVals] = useState(() => {
    const o: Record<string, string> = {};
    for (const p of ports) for (const [s] of SIZE_LABELS) o[key(p.code, s)] = initial[p.code]?.[s]?.toString() ?? "";
    return o;
  });
  const s = useSaver();
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="muted text-left text-xs uppercase tracking-wide">
              <th className="pb-2 font-medium">Uostas</th>
              {SIZE_LABELS.map(([, l]) => <th key={l} className="pb-2 pr-2 font-medium">{l}, $</th>)}
            </tr>
          </thead>
          <tbody>
            {ports.map((p) => (
              <tr key={p.code}>
                <td className="py-1 pr-3 whitespace-nowrap">{p.name}</td>
                {SIZE_LABELS.map(([sz, l]) => (
                  <td key={sz} className="py-1 pr-2">
                    <input
                      aria-label={`${p.name} ${l}`} inputMode="decimal" className="field py-1.5 tabular-nums" placeholder="—"
                      value={vals[key(p.code, sz)]}
                      onChange={(e) => { s.clear(); setVals({ ...vals, [key(p.code, sz)]: e.target.value }); }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SaveBar {...s} onSave={() => s.run(() => saveSea(
        Object.entries(vals).map(([k, price]) => { const [port, size] = k.split("|"); return { port, size, price }; }),
      ))} />
    </>
  );
}

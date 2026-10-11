import type { CalcResult } from "@/lib/calculator/types.ts";

export const eur = (n: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const usd = (n: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Galutinė kaina ir eilučių išskaidymas — naudoja skaičiuoklė ir loto puslapis. */
export default function Breakdown({
  result, portName, alternatives, usdToEur, fxBufferPct,
}: {
  result: CalcResult;
  portName: string;
  alternatives: number;
  usdToEur: number;
  fxBufferPct: number;
}) {
  return (
    <>
      <p className="label">Kaina Klaipėdoje su muitu ir PVM</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">{eur(result.totalEur)}</p>
      <p className="muted mt-2 text-sm">
        Per uostą {portName}
        {alternatives > 0 && " (pigiausias iš galimų maršrutų)"}
      </p>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="muted text-left text-xs uppercase tracking-wide">
            <th className="pb-2 font-medium">Eilutė</th>
            <th className="pb-2 text-right font-medium">USD</th>
            <th className="pb-2 text-right font-medium">EUR</th>
          </tr>
        </thead>
        <tbody>
          {result.lines.map((l) => (
            <tr key={l.key} className="border-t border-line">
              <td className="py-2">{l.label}</td>
              <td className="muted py-2 text-right tabular-nums">{l.usd !== undefined ? usd(l.usd) : ""}</td>
              <td className="py-2 text-right tabular-nums">{eur(l.eur)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-ink font-semibold">
            <td className="pt-3">Iš viso</td>
            <td />
            <td className="pt-3 text-right tabular-nums">{eur(result.totalEur)}</td>
          </tr>
        </tbody>
      </table>

      {result.warnings.length > 0 && (
        <ul className="warn mt-6 space-y-1 text-sm">
          {result.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
      <p className="muted mt-6 text-xs">
        Kursas: 1 $ = {usdToEur.toFixed(4)} € + {Math.round(fxBufferPct * 100)} % buferis.
        Kaina orientacinė — galutinė suma priklauso nuo muitinės sprendimo.
      </p>
    </>
  );
}

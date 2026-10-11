import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Katalogas — Tavo auto USA" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Copart ir IAAI katalogas</h1>
      <p className="muted mt-4">
        Katalogas su aktyviais ir praėjusiais aukcionais ruošiamas. Kol kas galite apskaičiuoti
        automobilio importo į Klaipėdą kainą.
      </p>
      <Link href="/skaiciuokle" className="btn mt-8 inline-block">Skaičiuoti kainą →</Link>
    </main>
  );
}

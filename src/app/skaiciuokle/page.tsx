import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { loadCalculatorData } from "@/lib/tariffs.ts";
import Calculator from "./Calculator.tsx";

export const metadata: Metadata = {
  title: "Importo kainos skaičiuoklė — Tavo auto USA",
  description: "Apskaičiuokite automobilio iš JAV aukciono kainą Klaipėdoje: transportas, jūra, muitas ir PVM.",
};

async function CalculatorLoader() {
  await connection(); // tarifai visada švieži iš DB, ne iš build'o metu sugeneruoto puslapio
  const data = await loadCalculatorData();
  return <Calculator data={data} />;
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <p className="label">Tavo auto USA</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Importo kainos skaičiuoklė</h1>
        <p className="muted mt-3">
          Pasirinkite aikštelę JAV, automobilio klasę ir aukciono kainą — pamatysite visą kelią iki
          Klaipėdos: transportą, jūrą, muitą ir PVM.
        </p>
      </header>
      <Suspense fallback={<p className="muted">Kraunami tarifai…</p>}>
        <CalculatorLoader />
      </Suspense>
    </main>
  );
}

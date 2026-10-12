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
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Kainos skaičiuoklė</h1>
        <p className="muted mt-3">
          Pasirinkite aikštelę JAV, automobilio klasę ir aukciono kainą — pamatysite visą kelią iki
          Klaipėdos: transportą, jūrą, muitą ir PVM.
        </p>
      </header>
      <div className="card">
        <Suspense fallback={<p className="muted">Kraunami tarifai…</p>}>
          <CalculatorLoader />
        </Suspense>
      </div>
      </div>
    </main>
  );
}

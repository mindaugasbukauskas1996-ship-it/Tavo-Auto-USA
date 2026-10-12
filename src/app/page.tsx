import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { latestLots, loadPlans } from "@/lib/catalog.ts";
import { loadCalculatorData } from "@/lib/tariffs.ts";
import Hero from "@/components/home/Hero.tsx";
import HowItWorks from "@/components/home/HowItWorks.tsx";
import Plans from "@/components/home/Plans.tsx";
import Brands from "@/components/home/Brands.tsx";
import LotCard from "@/components/LotCard.tsx";
import Calculator from "./skaiciuokle/Calculator.tsx";
import { IconArrowRight, IconCalc } from "@/components/icons.tsx";

async function Latest() {
  await connection();
  const lots = await latestLots(8);
  if (!lots.length) return <p className="muted">Šiuo metu aukcionų sąrašas atnaujinamas — užsukite po kelių minučių.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {lots.map((l) => <LotCard key={l.id} lot={l} />)}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[440px] animate-pulse rounded-xl bg-[var(--bg)]" />)}
    </div>
  );
}

async function CalculatorBlock() {
  await connection();
  return <Calculator data={await loadCalculatorData()} />;
}

async function PlansBlock() {
  await connection();
  return <Plans plans={await loadPlans()} />;
}

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />

      <section className="section">
        <div className="container-x">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="h2">Naujausi aukcionai</h2>
            <Link href="/katalogas" className="link flex shrink-0 items-center gap-1.5 text-[15px]">
              Visi pasiūlymai <IconArrowRight size={16} />
            </Link>
          </div>
          <Suspense fallback={<CardsSkeleton />}>
            <Latest />
          </Suspense>
        </div>
      </section>

      <Brands />

      <section id="skaiciuokle" className="section section-gray mt-10 scroll-mt-28">
        <div className="container-x">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg text-white" style={{ background: "var(--accent)" }}>
              <IconCalc size={22} />
            </span>
            <div>
              <h2 className="h2">Kainos skaičiuoklė</h2>
              <p className="muted text-sm">Kiek kainuos automobilis su transportu, muitu ir PVM Klaipėdoje</p>
            </div>
          </div>
          <div className="card">
            <Suspense fallback={<p className="muted">Kraunami tarifai…</p>}>
              <CalculatorBlock />
            </Suspense>
          </div>
        </div>
      </section>

      <HowItWorks />

      <Suspense fallback={null}>
        <PlansBlock />
      </Suspense>
    </main>
  );
}

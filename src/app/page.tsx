import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="label">Tavo auto USA</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Automobiliai iš JAV aukcionų į Klaipėdą</h1>
      <p className="muted mt-4 max-w-xl">
        Copart ir IAAI aukcionai, aiški galutinė kaina su transportu, muitu ir PVM.
        Katalogas ruošiamas — kol kas galite pasiskaičiuoti importo kainą.
      </p>
      <Link href="/skaiciuokle" className="btn mt-8 self-start">Skaičiuoti kainą →</Link>
    </main>
  );
}

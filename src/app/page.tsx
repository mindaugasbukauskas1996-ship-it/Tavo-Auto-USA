import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="label">Tavo auto USA</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Automobiliai iš JAV aukcionų į Klaipėdą</h1>
      <p className="muted mt-4 max-w-xl">
        Copart ir IAAI aukcionai, aiški galutinė kaina su transportu, muitu ir PVM.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/katalogas" className="btn">Žiūrėti automobilius →</Link>
        <Link href="/skaiciuokle" className="seg">Skaičiuoti kainą</Link>
      </div>
    </main>
  );
}

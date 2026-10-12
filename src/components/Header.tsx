import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/supabase/server.ts";
import { SITE, telHref } from "@/lib/site.ts";
import Logo from "./Logo.tsx";
import { IconHelp, IconMail, IconMenu, IconPhone, IconSearch } from "./icons.tsx";

const NAV = [
  { href: "/katalogas", label: "Automobiliai" },
  { href: "/katalogas?lot_status=Buy+Now", label: "Pirk dabar" },
  { href: "/#kaip-tai-veikia", label: "Kaip viskas veikia?" },
  { href: "/skaiciuokle", label: "Skaičiuoklė" },
  { href: "/#duk", label: "D.U.K." },
];

async function AccountButtons({ mobile = false }: { mobile?: boolean }) {
  const user = await currentUser();
  const cls = mobile ? "flex flex-col gap-2" : "flex items-center gap-2";
  if (!user) {
    return (
      <div className={cls}>
        <Link href="/prisijungti" className="btn-outline py-2">Prisijungti</Link>
        <Link href="/prisijungti?rezimas=registracija" className="btn py-2">Registruotis</Link>
      </div>
    );
  }
  return (
    <div className={cls}>
      {user.isAdmin && <Link href="/admin" className="btn-ghost">Administravimas</Link>}
      <Link href="/paskyra" className="btn-outline py-2">Mano paskyra</Link>
    </div>
  );
}

function VinSearch({ className = "" }: { className?: string }) {
  return (
    <form action="/katalogas" className={`relative ${className}`} role="search">
      <label htmlFor="vin-top" className="sr-only">VIN arba loto numeris</label>
      <input id="vin-top" name="s" placeholder="Ieškoti VIN arba loto numerio"
        className="w-full rounded-md border border-line bg-white py-1.5 pl-3 pr-9 text-sm outline-none focus:border-accent" />
      <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-accent" aria-label="Ieškoti">
        <IconSearch size={16} />
      </button>
    </form>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_var(--line)]">
      {/* Viršutinė juosta */}
      <div className="hidden border-b border-line md:block">
        <div className="container-x flex h-11 items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-6 text-muted">
            {SITE.phone && (
              <a href={telHref(SITE.phone)} className="flex items-center gap-2 hover:text-accent">
                <IconPhone size={16} /> {SITE.phone}
              </a>
            )}
            {SITE.email && (
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-accent">
                <IconMail size={16} /> {SITE.email}
              </a>
            )}
            {!SITE.phone && !SITE.email && <span>JAV aukcionų automobiliai su pristatymu į Klaipėdą</span>}
          </div>
          <div className="flex items-center gap-5">
            <VinSearch className="w-64" />
            <Link href="/#duk" className="flex items-center gap-1.5 text-muted hover:text-accent">
              <IconHelp size={16} /> Pagalba
            </Link>
          </div>
        </div>
      </div>

      {/* Pagrindinis meniu */}
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Pagrindinis meniu">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="nav-link">{n.label}</Link>)}
          </nav>
        </div>
        <div className="hidden lg:block">
          <Suspense fallback={<div className="h-10 w-56" />}>
            <AccountButtons />
          </Suspense>
        </div>

        {/* Mobilus meniu */}
        <details className="group lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-md p-2 hover:bg-[var(--bg)] [&::-webkit-details-marker]:hidden" aria-label="Meniu">
            <IconMenu size={26} />
          </summary>
          <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-lg">
            <div className="container-x space-y-4 py-5">
              <VinSearch />
              <nav className="flex flex-col" aria-label="Mobilus meniu">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="nav-link border-b border-line py-3">{n.label}</Link>
                ))}
              </nav>
              <Suspense fallback={null}>
                <AccountButtons mobile />
              </Suspense>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

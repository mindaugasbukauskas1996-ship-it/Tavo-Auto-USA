import Link from "next/link";
import { SITE, telHref } from "@/lib/site.ts";
import Logo from "./Logo.tsx";

export default function Footer() {
  const social = [
    { href: SITE.facebook, label: "Facebook" },
    { href: SITE.instagram, label: "Instagram" },
    { href: SITE.telegram, label: "Telegram" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="muted mt-4 max-w-sm text-sm">{SITE.tagline}</p>
          {social.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm">
              {social.map((s) => <a key={s.label} href={s.href} className="link" target="_blank" rel="noreferrer">{s.label}</a>)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Paslaugos</h3>
          <ul className="muted mt-3 space-y-2 text-sm">
            <li><Link href="/katalogas" className="hover:text-accent">Aukcionai</Link></li>
            <li><Link href="/katalogas?lot_status=Buy+Now" className="hover:text-accent">Pirk dabar</Link></li>
            <li><Link href="/skaiciuokle" className="hover:text-accent">Kainos skaičiuoklė</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Informacija</h3>
          <ul className="muted mt-3 space-y-2 text-sm">
            <li><Link href="/#kaip-tai-veikia" className="hover:text-accent">Kaip viskas veikia?</Link></li>
            <li><Link href="/#duk" className="hover:text-accent">D.U.K.</Link></li>
            <li><Link href="/#planai" className="hover:text-accent">Užstato planai</Link></li>
            <li><Link href="/paskyra" className="hover:text-accent">Mano paskyra</Link></li>
            {SITE.phone && <li><a href={telHref(SITE.phone)} className="hover:text-accent">{SITE.phone}</a></li>}
            {SITE.email && <li><a href={`mailto:${SITE.email}`} className="hover:text-accent">{SITE.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x muted py-5 text-sm">
          © 2026 {SITE.name}. Visos teisės saugomos.
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

/** Tavo auto USA logotipas — originalus ženklas (kelias su rodykle) ir pavadinimas. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Tavo auto USA — pradžia">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="9" fill="#0072EE" />
        <path d="M12 31 18 9h4l6 22" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M20 13v3M20 20v3M20 27v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="m25 7 4 3-4 3" fill="none" stroke="#9ec9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-none">
        <span className={`block text-[17px] font-extrabold tracking-tight ${light ? "text-white" : ""}`}>TAVO AUTO</span>
        <span className="block text-[11px] font-bold tracking-[0.3em]" style={{ color: light ? "#9ec9ff" : "var(--accent)" }}>USA</span>
      </span>
    </Link>
  );
}

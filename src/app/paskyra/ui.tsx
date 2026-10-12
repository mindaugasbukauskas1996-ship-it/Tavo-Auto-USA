"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "./actions.ts";
import { changePassword, updateProfile } from "./actions.ts";

export function Notice({ r }: { r: ActionResult | null }) {
  if (!r) return null;
  return <p className={`${r.ok ? "ok" : "warn"} text-sm`} role="status">{r.message}</p>;
}

/** Mygtukas, kviečiantis serverio veiksmą (su patvirtinimu, jei reikia). */
export function ActionButton({ action, label, className = "btn", confirmText }: {
  action: () => Promise<ActionResult>; label: string; className?: string; confirmText?: string;
}) {
  const [pending, start] = useTransition();
  const [r, setR] = useState<ActionResult | null>(null);
  const [asking, setAsking] = useState(false);
  const router = useRouter();
  const run = () => start(async () => { setAsking(false); const res = await action(); setR(res); if (res.ok) router.refresh(); });
  return (
    <div className="space-y-2">
      {asking ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{confirmText}</span>
          <button type="button" className="btn py-1.5" onClick={run}>Taip</button>
          <button type="button" className="btn-outline py-1.5" onClick={() => setAsking(false)}>Ne</button>
        </div>
      ) : (
        <button type="button" disabled={pending} className={`${className} disabled:opacity-60`}
          onClick={() => (confirmText ? setAsking(true) : run())}>
          {pending ? "Palaukite…" : label}
        </button>
      )}
      <Notice r={r} />
    </div>
  );
}

type Profile = Record<string, string>;

function Field({ name, label, p, type = "text", required = false, autoComplete }: {
  name: string; label: string; p: Profile; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={`p-${name}`} className="label">{label}{required && " *"}</label>
      <input id={`p-${name}`} name={name} type={type} defaultValue={p[name] ?? ""} required={required}
        autoComplete={autoComplete} className="field mt-1.5" />
    </div>
  );
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [r, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="first_name" label="Vardas" p={profile} required autoComplete="given-name" />
        <Field name="last_name" label="Pavardė" p={profile} required autoComplete="family-name" />
        <div>
          <label htmlFor="p-email" className="label">El. paštas</label>
          <input id="p-email" value={email} disabled className="field mt-1.5 opacity-70" />
        </div>
        <Field name="phone" label="Telefono numeris" p={profile} type="tel" autoComplete="tel" />
        <Field name="country" label="Šalis" p={profile} autoComplete="country-name" />
        <Field name="city" label="Miestas" p={profile} autoComplete="address-level2" />
        <Field name="address" label="Adresas" p={profile} autoComplete="street-address" />
        <Field name="zip" label="Pašto kodas" p={profile} autoComplete="postal-code" />
      </div>
      <div>
        <h3 className="font-semibold">Įmonės duomenys <span className="muted text-sm font-normal">(jei perkate įmonei)</span></h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field name="company_name" label="Įmonės pavadinimas" p={profile} autoComplete="organization" />
          <Field name="company_code" label="Įmonės kodas" p={profile} />
          <Field name="vat_code" label="PVM mokėtojo kodas" p={profile} />
          <Field name="company_address" label="Įmonės adresas" p={profile} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="btn disabled:opacity-60">{pending ? "Saugoma…" : "Išsaugoti pakeitimus"}</button>
        <Notice r={r} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [r, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="max-w-sm space-y-4">
      <div>
        <label htmlFor="pw1" className="label">Naujas slaptažodis</label>
        <input id="pw1" name="password" type="password" minLength={8} required autoComplete="new-password" className="field mt-1.5" />
      </div>
      <div>
        <label htmlFor="pw2" className="label">Pakartokite slaptažodį</label>
        <input id="pw2" name="password2" type="password" minLength={8} required autoComplete="new-password" className="field mt-1.5" />
      </div>
      <button disabled={pending} className="btn disabled:opacity-60">{pending ? "Keičiama…" : "Pakeisti slaptažodį"}</button>
      <Notice r={r} />
    </form>
  );
}

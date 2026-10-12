"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions.ts";

export default function AuthForm({ next, linkError, initialMode = "in" }: { next: string; linkError: boolean; initialMode?: "in" | "up" }) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`seg ${mode === "in" ? "seg-on" : ""}`} onClick={() => setMode("in")}>
          Prisijungti
        </button>
        <button type="button" className={`seg ${mode === "up" ? "seg-on" : ""}`} onClick={() => setMode("up")}>
          Registruotis
        </button>
      </div>

      <form action={mode === "in" ? inAction : upAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        {mode === "up" && (
          <>
            <div>
              <label htmlFor="full_name" className="label">Vardas, pavardė</label>
              <input id="full_name" name="full_name" required className="field mt-2" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Telefonas</label>
              <input id="phone" name="phone" type="tel" className="field mt-2" autoComplete="tel" />
            </div>
          </>
        )}
        <div>
          <label htmlFor="email" className="label">El. paštas</label>
          <input id="email" name="email" type="email" required className="field mt-2" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">Slaptažodis</label>
          <input
            id="password" name="password" type="password" required minLength={mode === "up" ? 8 : undefined}
            className="field mt-2" autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
        </div>

        {linkError && !state.error && !state.info && (
          <p className="warn text-sm">Patvirtinimo nuoroda nebegalioja. Prisijunkite arba registruokitės iš naujo.</p>
        )}
        {state.error && <p className="warn text-sm" role="alert">{state.error}</p>}
        {state.info && <p className="ok text-sm" role="status">{state.info}</p>}

        <button type="submit" disabled={pending} className="btn w-full disabled:opacity-60">
          {pending ? "Palaukite…" : mode === "in" ? "Prisijungti" : "Sukurti paskyrą"}
        </button>
      </form>
    </div>
  );
}

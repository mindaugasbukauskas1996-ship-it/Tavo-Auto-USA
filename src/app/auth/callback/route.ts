import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server.ts";

// El. pašto patvirtinimo nuoroda grįžta čia su ?code=…
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", url.origin));
  }
  return NextResponse.redirect(new URL("/prisijungti?klaida=nuoroda", url.origin));
}

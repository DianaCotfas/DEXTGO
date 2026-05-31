import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthRedirectOrigin } from "@/lib/auth-redirect-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[auth] sign-out failed", error);
    }
  }
  return NextResponse.redirect(new URL("/", resolveAuthRedirectOrigin(request)), {
    status: 303,
  });
}

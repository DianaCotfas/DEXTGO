import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ToggleBody = z.object({
  itinerarySlug: z.string().min(1),
  action: z.enum(["save", "remove"]),
});

const SAVED_TRIPS_TABLE_MISSING = "42P01";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ slugs: [] });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ slugs: [] });

  const { data, error } = await supabase
    .from("saved_trips")
    .select("itinerary_slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === SAVED_TRIPS_TABLE_MISSING) {
      // Graceful fallback while migration is rolling out in environments.
      return NextResponse.json({ slugs: [] });
    }
    return NextResponse.json(
      { code: "read-failed", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ slugs: (data ?? []).map((row) => row.itinerary_slug) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "auth-required", message: "Sign in to save trips." },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { code: "not-configured", message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const parsed = ToggleBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "bad-request", message: "Missing itinerarySlug or action." },
      { status: 400 },
    );
  }

  const { itinerarySlug, action } = parsed.data;

  if (action === "save") {
    const { error } = await supabase
      .from("saved_trips")
      .upsert(
        { user_id: user.id, itinerary_slug: itinerarySlug },
        { onConflict: "user_id,itinerary_slug" },
      );
    if (error) {
      if (error.code === SAVED_TRIPS_TABLE_MISSING) {
        return NextResponse.json(
          {
            code: "migration-required",
            message:
              "Saved trips table is not available yet. Please run latest Supabase migrations.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { code: "save-failed", message: error.message },
        { status: 500 },
      );
    }
  } else {
    const { error } = await supabase
      .from("saved_trips")
      .delete()
      .eq("user_id", user.id)
      .eq("itinerary_slug", itinerarySlug);
    if (error) {
      if (error.code === SAVED_TRIPS_TABLE_MISSING) {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json(
        { code: "remove-failed", message: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
